"use client";

import {
  authenticate,
  buildAuthUsers,
  findAuthUser,
  type AuthUser,
} from "@/lib/auth-users";
import type { SessionUser } from "@/lib/permissions";
import { isAdminAccess } from "@/lib/permissions";
import {
  defaultAccessLevelForPosition,
  permissionsTextForAccessLevel,
  type StaffAccessLevel,
} from "@/lib/staff-access";
import {
  loadStaffAccessOverrides,
  saveStaffAccessOverrides,
  type StaffAccessOverrides,
} from "@/lib/staff-access-storage";
import {
  loadStaffExtraStoresOverrides,
  saveStaffExtraStoresOverrides,
  type StaffExtraStoresOverrides,
} from "@/lib/staff-extra-stores-storage";
import {
  loadStaffHomeStoreOverrides,
  saveStaffHomeStoreOverrides,
  type StaffHomeStoreOverrides,
} from "@/lib/staff-home-store-storage";
import {
  loadStaffPasswordOverrides,
  saveStaffPasswordOverrides,
  type StaffPasswordOverrides,
} from "@/lib/staff-password-storage";
import {
  loadCustomStaff,
  mergeStaffRecords,
  normalizeCustomStaffRecord,
  saveCustomStaff,
} from "@/lib/staff-storage";
import {
  ADMIN_STAFF_RECORD,
  BUILTIN_STAFF_RECORDS,
  getDefaultPasswordForStaff,
  type StaffPosition,
  type StaffRecord,
} from "@/lib/staff-roster";
import { roleForPositionAndAccess } from "@/lib/staff-positions";
import {
  buildDesignerHomeStoreIndex,
  type DesignerHomeStoreIndex,
} from "@/lib/designer-staff-store";
import {
  buildStaffConfigSnapshotFromBrowserStorage,
  isStaffConfigStorageKey,
  loadStaffConfigFromStorage,
} from "@/lib/staff-config-sync";
import {
  loadCustomPositionDefinitions,
  loadCustomStoreNames,
  saveCustomPositionDefinitions,
  saveCustomStoreNames,
} from "@/lib/staff-config-storage";
import {
  ensureSnapshotCacheReady,
  getCachedStaffConfig,
  patchSnapshotCache,
  isSnapshotDirty,
  subscribeSnapshot,
} from "@/lib/snapshot-cache";
import type { StaffConfigSnapshot } from "@/lib/server/snapshot-types";
import { isRemoteSyncEnabled } from "@/lib/sync-config";
import { dedupePhysicalStores } from "@/lib/assigned-stores";
import { createShortId } from "@/lib/create-id";
import {
  resolveLiveSessionUser,
  sessionUsersEqual,
} from "@/lib/session-user";
import { isHeadquartersStore } from "@/lib/stores";
import type { StoreName } from "@/lib/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const AUTH_STORAGE_KEY = "custom-furniture-dispatch-auth-v1";

interface AuthContextValue {
  user: SessionUser | null;
  /** 与人员管理名册实时同步后的会话（权限/门店以名册为准） */
  liveUser: SessionUser | null;
  /** 设计师姓名 → 门店设置（含管理员修改） */
  designerHomeStoreIndex: DesignerHomeStoreIndex;
  isHydrated: boolean;
  staffRecords: StaffRecord[];
  login: (
    username: string,
    password: string,
  ) =>
    | { ok: true; role: SessionUser["role"]; accessLevel: StaffAccessLevel }
    | { ok: false; error?: string };
  logout: () => void;
  changeOwnPassword: (
    currentPassword: string,
    newPassword: string,
  ) => { ok: boolean; error?: string };
  addStaffMember: (data: {
    name: string;
    position: StaffPosition;
    homeStore: StoreName;
    extraStores?: StoreName[];
    password?: string;
    accessLevel?: StaffAccessLevel;
  }) => { ok: boolean; error?: string };
  updateStaffAccessLevel: (
    staffId: string,
    accessLevel: StaffAccessLevel,
  ) => { ok: boolean; error?: string };
  updateStaffHomeStore: (
    staffId: string,
    homeStore: StoreName,
  ) => { ok: boolean; error?: string };
  updateStaffExtraStores: (
    staffId: string,
    extraStores: StoreName[],
  ) => { ok: boolean; error?: string };
  resetStaffPassword: (
    staffId: string,
    password?: string,
  ) => { ok: boolean; error?: string };
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(user: AuthUser): SessionUser {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    accessLevel: user.accessLevel,
    homeStore: user.homeStore,
    assignedStores: user.assignedStores,
  };
}

function buildMergedStaff(
  customStaff: StaffRecord[],
  accessOverrides: StaffAccessOverrides,
  passwordOverrides: StaffPasswordOverrides,
  homeStoreOverrides: StaffHomeStoreOverrides,
  extraStoreOverrides: StaffExtraStoresOverrides,
): StaffRecord[] {
  return mergeStaffRecords(
    [ADMIN_STAFF_RECORD, ...BUILTIN_STAFF_RECORDS],
    customStaff,
    accessOverrides,
    passwordOverrides,
    homeStoreOverrides,
    extraStoreOverrides,
  );
}

function refreshSessionForUser(
  username: string,
  customStaff: StaffRecord[],
  accessOverrides: StaffAccessOverrides,
  passwordOverrides: StaffPasswordOverrides,
  homeStoreOverrides: StaffHomeStoreOverrides,
  extraStoreOverrides: StaffExtraStoresOverrides,
  setSessionUser: (user: SessionUser | null) => void,
): void {
  const users = buildAuthUsers(
    customStaff,
    accessOverrides,
    passwordOverrides,
    homeStoreOverrides,
    extraStoreOverrides,
  );
  const found = findAuthUser(users, username);
  if (found) {
    const session = toSession(found);
    setSessionUser(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

function isCustomStaffRecord(staffId: string, customStaff: StaffRecord[]): boolean {
  return customStaff.some((s) => s.id === staffId);
}

function staffConfigFromStorage(): StaffConfigSnapshot {
  return buildStaffConfigSnapshotFromBrowserStorage();
}

function persistStaffConfigToLocalStorage(config: StaffConfigSnapshot): void {
  saveCustomStaff(config.customStaff);
  saveStaffAccessOverrides(config.accessOverrides);
  saveStaffPasswordOverrides(config.passwordOverrides);
  saveStaffHomeStoreOverrides(config.homeStoreOverrides);
  saveStaffExtraStoresOverrides(config.extraStoreOverrides);
  saveCustomPositionDefinitions(config.customPositions);
  saveCustomStoreNames(config.customStores);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [customStaff, setCustomStaff] = useState<StaffRecord[]>([]);
  const [accessOverrides, setAccessOverrides] = useState<StaffAccessOverrides>(
    {},
  );
  const [passwordOverrides, setPasswordOverrides] =
    useState<StaffPasswordOverrides>({});
  const [homeStoreOverrides, setHomeStoreOverrides] =
    useState<StaffHomeStoreOverrides>({});
  const [extraStoreOverrides, setExtraStoreOverrides] =
    useState<StaffExtraStoresOverrides>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const staffApplyingRemoteRef = useRef(false);
  const staffRemoteReadyRef = useRef(false);

  const applyStaffConfig = useCallback((config: StaffConfigSnapshot) => {
    setCustomStaff(config.customStaff.map(normalizeCustomStaffRecord));
    setAccessOverrides(config.accessOverrides);
    setPasswordOverrides(config.passwordOverrides);
    setHomeStoreOverrides(config.homeStoreOverrides);
    setExtraStoreOverrides(config.extraStoreOverrides);
    persistStaffConfigToLocalStorage(config);
  }, []);

  const staffRecords = useMemo(
    () =>
      buildMergedStaff(
        customStaff,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
      ),
    [
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
    ],
  );

  const liveUser = useMemo(
    () => resolveLiveSessionUser(sessionUser, staffRecords),
    [sessionUser, staffRecords],
  );

  const designerHomeStoreIndex = useMemo(
    () => buildDesignerHomeStoreIndex(staffRecords),
    [staffRecords],
  );

  const authUsers = useMemo(
    () =>
      buildAuthUsers(
        customStaff,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
      ),
    [
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let config = staffConfigFromStorage();
      if (isRemoteSyncEnabled()) {
        try {
          await ensureSnapshotCacheReady();
          config = getCachedStaffConfig();
        } catch {
          config = staffConfigFromStorage();
        }
      }
      if (cancelled) return;

      applyStaffConfig(config);
      staffRemoteReadyRef.current = true;

      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SessionUser;
          const users = buildAuthUsers(
            config.customStaff,
            config.accessOverrides,
            config.passwordOverrides,
            config.homeStoreOverrides,
            config.extraStoreOverrides,
          );
          const found = findAuthUser(users, parsed.username);
          if (
            found &&
            found.role === parsed.role &&
            found.accessLevel === (parsed.accessLevel ?? found.accessLevel)
          ) {
            setSessionUser(toSession(found));
          }
        } catch {
          /* ignore */
        }
      }
      setIsHydrated(true);
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [applyStaffConfig]);

  useEffect(() => {
    if (!isRemoteSyncEnabled()) return;
    return subscribeSnapshot((snap) => {
      if (isSnapshotDirty()) return;
      staffApplyingRemoteRef.current = true;
      applyStaffConfig(snap.staffConfig);
      queueMicrotask(() => {
        staffApplyingRemoteRef.current = false;
      });
    });
  }, [applyStaffConfig]);

  useEffect(() => {
    if (!isHydrated || !isRemoteSyncEnabled() || !staffRemoteReadyRef.current) {
      return;
    }
    if (staffApplyingRemoteRef.current) return;
    patchSnapshotCache({
      staffConfig: {
        customStaff,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
        customPositions: loadCustomPositionDefinitions(),
        customStores: loadCustomStoreNames(),
      },
    });
  }, [
    isHydrated,
    customStaff,
    accessOverrides,
    passwordOverrides,
    homeStoreOverrides,
    extraStoreOverrides,
  ]);

  useEffect(() => {
    function reloadStaffConfigFromStorage() {
      const config = loadStaffConfigFromStorage();
      setCustomStaff(config.customStaff);
      setAccessOverrides(config.accessOverrides);
      setPasswordOverrides(config.passwordOverrides);
      setHomeStoreOverrides(config.homeStoreOverrides);
      setExtraStoreOverrides(config.extraStoreOverrides);
    }

    function onStorage(event: StorageEvent) {
      if (!isStaffConfigStorageKey(event.key)) return;
      reloadStaffConfigFromStorage();
      if (isRemoteSyncEnabled()) {
        patchSnapshotCache({
          staffConfig: buildStaffConfigSnapshotFromBrowserStorage(),
        });
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!sessionUser) return;
    const next = resolveLiveSessionUser(sessionUser, staffRecords);
    if (!next || sessionUsersEqual(sessionUser, next)) return;
    setSessionUser(next);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  }, [sessionUser, staffRecords]);

  const login = useCallback(
    (username: string, password: string) => {
      const found = authenticate(authUsers, username, password);
      if (!found) {
        return { ok: false as const, error: "账号或密码错误" };
      }
      const session = toSession(found);
      setSessionUser(session);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      return {
        ok: true as const,
        role: session.role,
        accessLevel: session.accessLevel,
      };
    },
    [authUsers],
  );

  const logout = useCallback(() => {
    setSessionUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const changeOwnPassword = useCallback(
    (currentPassword: string, newPassword: string) => {
      if (!liveUser) return { ok: false, error: "请先登录" };
      const trimmed = newPassword.trim();
      if (trimmed.length < 1) {
        return { ok: false, error: "新密码不能为空" };
      }

      const found = authenticate(authUsers, liveUser.username, currentPassword);
      if (!found) {
        return { ok: false, error: "当前密码不正确" };
      }

      const target = staffRecords.find((s) => s.name === liveUser.username);
      if (!target) {
        return { ok: false, error: "未找到账号信息" };
      }

      if (isCustomStaffRecord(target.id, customStaff)) {
        const nextCustom = customStaff.map((s) =>
          s.id === target.id ? { ...s, password: trimmed } : s,
        );
        setCustomStaff(nextCustom);
        saveCustomStaff(nextCustom);
      } else {
        const nextPasswords = { ...passwordOverrides, [target.id]: trimmed };
        setPasswordOverrides(nextPasswords);
        saveStaffPasswordOverrides(nextPasswords);
      }

      return { ok: true };
    },
    [liveUser, authUsers, staffRecords, customStaff, passwordOverrides],
  );

  const addStaffMember = useCallback(
    (data: {
      name: string;
      position: StaffPosition;
      homeStore: StoreName;
      extraStores?: StoreName[];
      password?: string;
      accessLevel?: StaffAccessLevel;
    }) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可添加人员" };
      }
      const name = data.name.trim();
      if (!name) return { ok: false, error: "请填写姓名" };
      if (name === "admin") {
        return { ok: false, error: "不能使用 admin 作为姓名" };
      }
      const merged = buildMergedStaff(
        customStaff,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
      );
      const exists = merged.some((s) => s.name === name);
      if (exists) {
        return { ok: false, error: "该姓名已存在" };
      }

      const accessLevel =
        data.accessLevel ?? defaultAccessLevelForPosition(data.position);

      const extraStores =
        accessLevel === "design_manager" && !isHeadquartersStore(data.homeStore)
          ? dedupePhysicalStores(data.extraStores ?? []).filter(
              (s) => s !== data.homeStore,
            )
          : undefined;

      const record: StaffRecord = {
        id: createShortId("custom-"),
        name,
        position: data.position,
        homeStore: data.homeStore,
        ...(extraStores?.length ? { extraStores } : {}),
        role: roleForPositionAndAccess(data.position, accessLevel),
        password: data.password?.trim() || "1",
        accessLevel,
        permissions: permissionsTextForAccessLevel(accessLevel),
      };

      const next = [...customStaff, record];
      setCustomStaff(next);
      saveCustomStaff(next);
      return { ok: true };
    },
    [
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      liveUser,
    ],
  );

  const updateStaffAccessLevel = useCallback(
    (staffId: string, accessLevel: StaffAccessLevel) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可调整权限" };
      }
      const target = staffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }
      if (target.id === ADMIN_STAFF_RECORD.id && accessLevel !== "admin") {
        return { ok: false, error: "系统管理员须保持管理员权限" };
      }

      const nextOverrides = { ...accessOverrides, [staffId]: accessLevel };
      setAccessOverrides(nextOverrides);
      saveStaffAccessOverrides(nextOverrides);

      let nextExtraStores = extraStoreOverrides;
      if (accessLevel !== "design_manager") {
        nextExtraStores = { ...extraStoreOverrides };
        delete nextExtraStores[staffId];
        setExtraStoreOverrides(nextExtraStores);
        saveStaffExtraStoresOverrides(nextExtraStores);
      }

      if (liveUser?.username === target.name) {
        refreshSessionForUser(
          target.name,
          customStaff,
          nextOverrides,
          passwordOverrides,
          homeStoreOverrides,
          nextExtraStores,
          setSessionUser,
        );
      }

      return { ok: true };
    },
    [
      staffRecords,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      liveUser,
      customStaff,
    ],
  );

  const updateStaffHomeStore = useCallback(
    (staffId: string, homeStore: StoreName) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可调整门店设置" };
      }
      const target = staffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }

      let nextCustom = customStaff;
      let nextHomeStores = homeStoreOverrides;
      let nextExtraStores = extraStoreOverrides;

      if (isCustomStaffRecord(target.id, customStaff)) {
        nextCustom = customStaff.map((s) => {
          if (s.id !== target.id) return s;
          if (isHeadquartersStore(homeStore)) {
            const { extraStores: _removed, ...rest } = s;
            return { ...rest, homeStore };
          }
          const extra = (s.extraStores ?? []).filter((store) => store !== homeStore);
          return extra.length
            ? { ...s, homeStore, extraStores: extra }
            : { ...s, homeStore, extraStores: undefined };
        });
        setCustomStaff(nextCustom);
        saveCustomStaff(nextCustom);
      } else {
        nextHomeStores = { ...homeStoreOverrides, [staffId]: homeStore };
        setHomeStoreOverrides(nextHomeStores);
        saveStaffHomeStoreOverrides(nextHomeStores);
        if (isHeadquartersStore(homeStore)) {
          nextExtraStores = { ...extraStoreOverrides };
          delete nextExtraStores[staffId];
          setExtraStoreOverrides(nextExtraStores);
          saveStaffExtraStoresOverrides(nextExtraStores);
        }
      }

      if (liveUser?.username === target.name) {
        refreshSessionForUser(
          target.name,
          nextCustom,
          accessOverrides,
          passwordOverrides,
          nextHomeStores,
          nextExtraStores,
          setSessionUser,
        );
      }

      return { ok: true };
    },
    [
      staffRecords,
      homeStoreOverrides,
      extraStoreOverrides,
      liveUser,
      customStaff,
      accessOverrides,
      passwordOverrides,
    ],
  );

  const updateStaffExtraStores = useCallback(
    (staffId: string, extraStores: StoreName[]) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可调整门店设置" };
      }
      const target = staffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }
      if (target.accessLevel !== "design_manager") {
        return { ok: false, error: "仅设计经理可设置多门店" };
      }
      if (isHeadquartersStore(target.homeStore)) {
        return { ok: false, error: "总部设计经理无需附加门店" };
      }

      const normalized = dedupePhysicalStores(extraStores).filter(
        (store) => store !== target.homeStore,
      );

      let nextCustom = customStaff;
      let nextExtraStores = extraStoreOverrides;

      if (isCustomStaffRecord(target.id, customStaff)) {
        nextCustom = customStaff.map((s) => {
          if (s.id !== target.id) return s;
          return normalized.length
            ? { ...s, extraStores: normalized }
            : { ...s, extraStores: undefined };
        });
        setCustomStaff(nextCustom);
        saveCustomStaff(nextCustom);
      } else {
        nextExtraStores = { ...extraStoreOverrides };
        if (normalized.length) {
          nextExtraStores[staffId] = normalized;
        } else {
          delete nextExtraStores[staffId];
        }
        setExtraStoreOverrides(nextExtraStores);
        saveStaffExtraStoresOverrides(nextExtraStores);
      }

      if (liveUser?.username === target.name) {
        refreshSessionForUser(
          target.name,
          nextCustom,
          accessOverrides,
          passwordOverrides,
          homeStoreOverrides,
          nextExtraStores,
          setSessionUser,
        );
      }

      return { ok: true };
    },
    [
      staffRecords,
      liveUser,
      customStaff,
      extraStoreOverrides,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
    ],
  );

  const resetStaffPassword = useCallback(
    (staffId: string, password?: string) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可重置密码" };
      }
      const target = staffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }

      const nextPassword =
        password?.trim() || getDefaultPasswordForStaff(target);

      if (isCustomStaffRecord(target.id, customStaff)) {
        const nextCustom = customStaff.map((s) =>
          s.id === target.id ? { ...s, password: nextPassword } : s,
        );
        setCustomStaff(nextCustom);
        saveCustomStaff(nextCustom);
      } else {
        const nextPasswords = {
          ...passwordOverrides,
          [target.id]: nextPassword,
        };
        setPasswordOverrides(nextPasswords);
        saveStaffPasswordOverrides(nextPasswords);
      }

      return { ok: true };
    },
    [staffRecords, customStaff, passwordOverrides, liveUser],
  );

  const value = useMemo(
    () => ({
      user: liveUser,
      liveUser,
      designerHomeStoreIndex,
      isHydrated,
      staffRecords,
      login,
      logout,
      changeOwnPassword,
      addStaffMember,
      updateStaffAccessLevel,
      updateStaffHomeStore,
      updateStaffExtraStores,
      resetStaffPassword,
    }),
    [
      liveUser,
      designerHomeStoreIndex,
      isHydrated,
      staffRecords,
      login,
      logout,
      changeOwnPassword,
      addStaffMember,
      updateStaffAccessLevel,
      updateStaffHomeStore,
      updateStaffExtraStores,
      resetStaffPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
