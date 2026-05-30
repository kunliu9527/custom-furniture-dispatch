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
  loadStaffPhoneOverrides,
  saveStaffPhoneOverrides,
  type StaffPhoneOverrides,
} from "@/lib/staff-phone-storage";
import {
  loadStaffPasswordOverrides,
  saveStaffPasswordOverrides,
  type StaffPasswordOverrides,
} from "@/lib/staff-password-storage";
import {
  saveRemovedStaffIds,
  type RemovedStaffIds,
} from "@/lib/staff-removed-storage";
import {
  buildMergedStaffRecords,
  buildStaffConfigSnapshot,
  clearStaffOverridesForId,
  isCustomStaffId,
  loadStaffConfigFromBrowser,
  patchRemoteStaffConfigIfSynced,
  persistStaffConfigToLocalStorage,
} from "@/lib/auth-staff-config";
import { fetchLocalDevSnapshot } from "@/lib/local-snapshot-bootstrap";
import {
  filterStaffRecordsForViewer,
  validateNewStaffAccessLevel,
  validateNewStaffName,
  validateStaffAccessLevelChange,
} from "@/lib/staff-admin-rules";
import {
  loadCustomStaff,
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
} from "@/lib/staff-config-sync";
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
import { resolveLiveSessionUser, sessionUsersEqual } from "@/lib/session-user";
import { isHeadquartersStore } from "@/lib/stores";
import {
  DEFAULT_SITE_BRANDING,
  normalizeSiteBranding,
  type SiteBranding,
} from "@/lib/site-branding";
import { saveSiteBranding } from "@/lib/site-branding-storage";
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
    | {
        ok: true;
        role: SessionUser["role"];
        accessLevel: StaffAccessLevel;
        position?: string;
      }
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
    phone?: string;
    accessLevel?: StaffAccessLevel;
  }) => { ok: boolean; error?: string };
  updateStaffPhone: (
    staffId: string,
    phone: string,
  ) => { ok: boolean; error?: string };
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
  deleteStaffMember: (staffId: string) => { ok: boolean; error?: string };
  siteBranding: SiteBranding;
  updateSiteBranding: (patch: Partial<SiteBranding>) => {
    ok: boolean;
    error?: string;
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(user: AuthUser): SessionUser {
  return {
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    accessLevel: user.accessLevel,
    position: user.position,
    homeStore: user.homeStore,
    assignedStores: user.assignedStores,
  };
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
  const [phoneOverrides, setPhoneOverrides] = useState<StaffPhoneOverrides>({});
  const [removedStaffIds, setRemovedStaffIds] = useState<RemovedStaffIds>([]);
  const [siteBranding, setSiteBranding] = useState<SiteBranding>({
    ...DEFAULT_SITE_BRANDING,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const staffApplyingRemoteRef = useRef(false);
  const staffRemoteReadyRef = useRef(false);

  const syncStaffConfigToRemote = useCallback(
    (sources: {
      customStaff: StaffRecord[];
      accessOverrides: StaffAccessOverrides;
      passwordOverrides: StaffPasswordOverrides;
      homeStoreOverrides: StaffHomeStoreOverrides;
      extraStoreOverrides: StaffExtraStoresOverrides;
      phoneOverrides: StaffPhoneOverrides;
      removedStaffIds: RemovedStaffIds;
      siteBranding: SiteBranding;
    }) => {
      patchRemoteStaffConfigIfSynced(buildStaffConfigSnapshot(sources));
    },
    [],
  );

  const applyStaffConfig = useCallback((config: StaffConfigSnapshot) => {
    setCustomStaff(config.customStaff);
    setAccessOverrides(config.accessOverrides);
    setPasswordOverrides(config.passwordOverrides);
    setHomeStoreOverrides(config.homeStoreOverrides);
    setExtraStoreOverrides(config.extraStoreOverrides);
    setPhoneOverrides(config.phoneOverrides);
    setRemovedStaffIds(config.removedStaffIds);
    setSiteBranding(normalizeSiteBranding(config.siteBranding));
    persistStaffConfigToLocalStorage(config);
  }, []);

  const allStaffRecords = useMemo(
    () =>
      buildMergedStaffRecords({
        customStaff,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
        phoneOverrides,
        removedStaffIds,
      }),
    [
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      phoneOverrides,
      removedStaffIds,
    ],
  );

  const liveUser = useMemo(() => {
    const next = resolveLiveSessionUser(sessionUser, allStaffRecords);
    return next;
  }, [sessionUser, allStaffRecords]);

  const liveUserStableRef = useRef<SessionUser | null>(null);
  const liveUserStable = useMemo(() => {
    const next = liveUser;
    if (!next) {
      liveUserStableRef.current = null;
      return null;
    }
    if (
      liveUserStableRef.current &&
      sessionUsersEqual(liveUserStableRef.current, next)
    ) {
      return liveUserStableRef.current;
    }
    liveUserStableRef.current = next;
    return next;
  }, [liveUser]);

  const staffRecords = useMemo(
    () => filterStaffRecordsForViewer(allStaffRecords, liveUserStable),
    [allStaffRecords, liveUserStable],
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
      let config = loadStaffConfigFromBrowser();
      if (isRemoteSyncEnabled()) {
        try {
          await ensureSnapshotCacheReady();
          config = getCachedStaffConfig();
        } catch {
          config = loadStaffConfigFromBrowser();
        }
      } else {
        try {
          const snap = await fetchLocalDevSnapshot();
          if (snap?.staffConfig) {
            config = {
              ...config,
              ...snap.staffConfig,
              siteBranding: snap.staffConfig.siteBranding ?? config.siteBranding,
            };
            persistStaffConfigToLocalStorage(config);
          }
        } catch {
          /* 使用浏览器已有人员配置 */
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
    syncStaffConfigToRemote({
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      phoneOverrides,
      removedStaffIds,
      siteBranding,
    });
  }, [
    isHydrated,
    customStaff,
    accessOverrides,
    passwordOverrides,
    homeStoreOverrides,
    extraStoreOverrides,
    phoneOverrides,
    removedStaffIds,
    siteBranding,
    syncStaffConfigToRemote,
  ]);

  useEffect(() => {
    function reloadStaffConfigFromStorage() {
      applyStaffConfig(buildStaffConfigSnapshotFromBrowserStorage());
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
    const next = resolveLiveSessionUser(sessionUser, allStaffRecords);
    if (!next || sessionUsersEqual(sessionUser, next)) return;
    setSessionUser(next);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  }, [sessionUser, allStaffRecords]);

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
        position: session.position,
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

      const target = allStaffRecords.find((s) => s.name === liveUser.username);
      if (!target) {
        return { ok: false, error: "未找到账号信息" };
      }

      if (isCustomStaffId(target.id, customStaff)) {
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
    [liveUser, authUsers, allStaffRecords, customStaff, passwordOverrides],
  );

  const addStaffMember = useCallback(
    (data: {
      name: string;
      position: StaffPosition;
      homeStore: StoreName;
      extraStores?: StoreName[];
      password?: string;
      phone?: string;
      accessLevel?: StaffAccessLevel;
    }) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可添加人员" };
      }
      const nameCheck = validateNewStaffName(data.name);
      if (!nameCheck.ok) return nameCheck;
      const name = data.name.trim();

      const merged = buildMergedStaffRecords({
        customStaff,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
        phoneOverrides,
        removedStaffIds,
      });
      if (merged.some((s) => s.name === name)) {
        return { ok: false, error: "该姓名已存在" };
      }

      const accessLevel =
        data.accessLevel ?? defaultAccessLevelForPosition(data.position);
      const levelCheck = validateNewStaffAccessLevel(accessLevel);
      if (!levelCheck.ok) return levelCheck;

      const extraStores =
        accessLevel === "design_manager" && !isHeadquartersStore(data.homeStore)
          ? dedupePhysicalStores(data.extraStores ?? []).filter(
              (s) => s !== data.homeStore,
            )
          : undefined;

      const phone = data.phone?.trim();
      const record: StaffRecord = {
        id: createShortId("custom-"),
        name,
        position: data.position,
        homeStore: data.homeStore,
        ...(extraStores?.length ? { extraStores } : {}),
        ...(phone ? { phone } : {}),
        role: roleForPositionAndAccess(data.position, accessLevel),
        password: data.password?.trim() || "1",
        accessLevel,
        permissions: permissionsTextForAccessLevel(accessLevel),
      };

      const next = [...customStaff, record];
      setCustomStaff(next);
      saveCustomStaff(next);
      syncStaffConfigToRemote({
        customStaff: next,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
        phoneOverrides,
        removedStaffIds,
        siteBranding,
      });
      return { ok: true };
    },
    [
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      phoneOverrides,
      removedStaffIds,
      siteBranding,
      liveUser,
      syncStaffConfigToRemote,
    ],
  );

  const updateStaffAccessLevel = useCallback(
    (staffId: string, accessLevel: StaffAccessLevel) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可调整权限" };
      }
      const target = allStaffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }
      const levelCheck = validateStaffAccessLevelChange(staffId, accessLevel);
      if (!levelCheck.ok) return levelCheck;

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
      allStaffRecords,
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
      const target = allStaffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }

      let nextCustom = customStaff;
      let nextHomeStores = homeStoreOverrides;
      let nextExtraStores = extraStoreOverrides;

      if (isCustomStaffId(target.id, customStaff)) {
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
      allStaffRecords,
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
      const target = allStaffRecords.find((s) => s.id === staffId);
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

      if (isCustomStaffId(target.id, customStaff)) {
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
      allStaffRecords,
      liveUser,
      customStaff,
      extraStoreOverrides,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
    ],
  );

  const updateStaffPhone = useCallback(
    (staffId: string, phone: string) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可修改电话" };
      }
      const target = allStaffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }

      const trimmed = phone.trim();
      let nextCustom = customStaff;
      let nextPhones = phoneOverrides;

      if (isCustomStaffId(target.id, customStaff)) {
        nextCustom = customStaff.map((s) => {
          if (s.id !== target.id) return s;
          if (!trimmed) {
            const { phone: _removed, ...rest } = s;
            return rest as StaffRecord;
          }
          return { ...s, phone: trimmed };
        });
        setCustomStaff(nextCustom);
        saveCustomStaff(nextCustom);
      } else {
        nextPhones = { ...phoneOverrides };
        if (trimmed) {
          nextPhones[staffId] = trimmed;
        } else {
          delete nextPhones[staffId];
        }
        setPhoneOverrides(nextPhones);
        saveStaffPhoneOverrides(nextPhones);
      }

      syncStaffConfigToRemote({
        customStaff: nextCustom,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
        phoneOverrides: nextPhones,
        removedStaffIds,
        siteBranding,
      });

      return { ok: true };
    },
    [
      allStaffRecords,
      liveUser,
      customStaff,
      phoneOverrides,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      removedStaffIds,
      siteBranding,
      syncStaffConfigToRemote,
    ],
  );

  const resetStaffPassword = useCallback(
    (staffId: string, password?: string) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可重置密码" };
      }
      const target = allStaffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }

      const nextPassword =
        password?.trim() || getDefaultPasswordForStaff(target);

      if (isCustomStaffId(target.id, customStaff)) {
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
    [allStaffRecords, customStaff, passwordOverrides, liveUser],
  );

  const deleteStaffMember = useCallback(
    (staffId: string) => {
      if (!liveUser || !isAdminAccess(liveUser)) {
        return { ok: false, error: "仅管理员可删除人员" };
      }
      if (staffId === ADMIN_STAFF_RECORD.id) {
        return { ok: false, error: "系统管理员不可删除" };
      }
      const target = allStaffRecords.find((s) => s.id === staffId);
      if (!target) {
        return { ok: false, error: "未找到该人员" };
      }

      const cleared = clearStaffOverridesForId(staffId, {
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
        phoneOverrides,
      });

      let nextCustom = customStaff;
      let nextRemoved = removedStaffIds;

      if (isCustomStaffId(target.id, customStaff)) {
        nextCustom = customStaff.filter((s) => s.id !== staffId);
        setCustomStaff(nextCustom);
        saveCustomStaff(nextCustom);
      } else {
        nextRemoved = [...new Set([...removedStaffIds, staffId])];
        setRemovedStaffIds(nextRemoved);
        saveRemovedStaffIds(nextRemoved);
      }

      setAccessOverrides(cleared.accessOverrides);
      saveStaffAccessOverrides(cleared.accessOverrides);
      setPasswordOverrides(cleared.passwordOverrides);
      saveStaffPasswordOverrides(cleared.passwordOverrides);
      setHomeStoreOverrides(cleared.homeStoreOverrides);
      saveStaffHomeStoreOverrides(cleared.homeStoreOverrides);
      setExtraStoreOverrides(cleared.extraStoreOverrides);
      saveStaffExtraStoresOverrides(cleared.extraStoreOverrides);
      setPhoneOverrides(cleared.phoneOverrides);
      saveStaffPhoneOverrides(cleared.phoneOverrides);

      syncStaffConfigToRemote({
        customStaff: nextCustom,
        accessOverrides: cleared.accessOverrides,
        passwordOverrides: cleared.passwordOverrides,
        homeStoreOverrides: cleared.homeStoreOverrides,
        extraStoreOverrides: cleared.extraStoreOverrides,
        phoneOverrides: cleared.phoneOverrides,
        removedStaffIds: nextRemoved,
        siteBranding,
      });

      return { ok: true };
    },
    [
      liveUser,
      allStaffRecords,
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      phoneOverrides,
      removedStaffIds,
      siteBranding,
      syncStaffConfigToRemote,
    ],
  );

  const updateSiteBranding = useCallback(
    (patch: Partial<SiteBranding>) => {
      if (!isAdminAccess(liveUser)) {
        return { ok: false as const, error: "仅管理员可修改公司名" };
      }
      const next = normalizeSiteBranding({ ...siteBranding, ...patch });
      if (
        next.badgeLabel === siteBranding.badgeLabel &&
        next.headlineTitle === siteBranding.headlineTitle &&
        next.standardContractText === siteBranding.standardContractText
      ) {
        return { ok: true as const };
      }
      setSiteBranding(next);
      saveSiteBranding(next);
      syncStaffConfigToRemote({
        customStaff,
        accessOverrides,
        passwordOverrides,
        homeStoreOverrides,
        extraStoreOverrides,
        phoneOverrides,
        removedStaffIds,
        siteBranding: next,
      });
      return { ok: true as const };
    },
    [
      liveUser,
      siteBranding,
      customStaff,
      accessOverrides,
      passwordOverrides,
      homeStoreOverrides,
      extraStoreOverrides,
      phoneOverrides,
      removedStaffIds,
      syncStaffConfigToRemote,
    ],
  );

  const value = useMemo(
    () => ({
      user: liveUserStable,
      liveUser: liveUserStable,
      designerHomeStoreIndex,
      isHydrated,
      staffRecords,
      siteBranding,
      login,
      logout,
      changeOwnPassword,
      addStaffMember,
      updateStaffPhone,
      updateStaffAccessLevel,
      updateStaffHomeStore,
      updateStaffExtraStores,
      resetStaffPassword,
      deleteStaffMember,
      updateSiteBranding,
    }),
    [
      liveUserStable,
      designerHomeStoreIndex,
      isHydrated,
      staffRecords,
      siteBranding,
      login,
      logout,
      changeOwnPassword,
      addStaffMember,
      updateStaffPhone,
      updateStaffAccessLevel,
      updateStaffHomeStore,
      updateStaffExtraStores,
      resetStaffPassword,
      deleteStaffMember,
      updateSiteBranding,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
