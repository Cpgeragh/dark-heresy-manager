// src/pages/Settings.tsx
// User settings: recovery code management and device linking.

import { useCallback, useEffect, useRef, useState } from "react";
import { getRecoveryCode, rotateRecoveryCode } from "../services/identityService";
import { deleteCurrentAccount } from "../services/userAccountService";
import {
  disconnectOtherDevice,
  listLinkedDevices,
  renameLinkedDevice,
  LastDeviceDisconnectError,
  type LinkedDevice,
} from "../services/deviceLinkService";
import { saveFirstName } from "../services/profileService";
import { useToast } from "../components/Toast";
import { InfoModal } from "../components/InfoModal";
import { PRODUCT_LIMITS } from "../constants/productLimits";
import { colourAmberPlain } from "../ui/styles/colourTokens";
import { editableInputClass, uiInfoModalWrapper } from "../ui/styles/editableStyles";
import { Button } from "../ui/buttons/Button";
import { ManageDevicesButton } from "../ui/buttons/ManageDevicesButton";
import { ViewButton } from "../ui/buttons/ViewButton";
import { RemoveButton } from "../ui/buttons/RemoveButton";
import { EditButton } from "../ui/buttons/EditButton";
import { UnlinkButton } from "../ui/buttons/UnlinkButton";
import { PickerModal, PickerBody } from "../ui/pickers/PickerModal";
import { formatFirstNameInput } from "../utils/firstName";
import { ModalShell } from "../ui/modals/ModalShell";
import { ModalHeader } from "../ui/modals/ModalHeader";

interface Props {
  effectiveUserId: string;
  firstName: string;
  disconnect: (confirmLastDevice?: boolean) => Promise<void>;
  onClose: () => void;
}

const settingsRowClass = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 lg:py-5";
const settingsLabelClass =
  "font-cinzel text-sm font-semibold uppercase tracking-wider text-slate-200 lg:text-base";

export default function Settings({ effectiveUserId, firstName, disconnect, onClose }: Props) {
  const toast = useToast();

  // ── Display name state ───────────────────────────────────────────────────
  const [nameDraft, setNameDraft] = useState(firstName);
  const [savingName, setSavingName] = useState(false);
  const savingNameRef = useRef(false);
  const [editNameOpen, setEditNameOpen] = useState(false);

  // ── Recovery code state ──────────────────────────────────────────────────
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [revealTitle, setRevealTitle] = useState("Reveal Code");
  const [revealing, setRevealing] = useState(false);
  const revealingRef = useRef(false);
  const [rotating, setRotating] = useState(false);
  const rotatingRef = useRef(false);
  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);

  // ── Device link state ────────────────────────────────────────────────────
  const [disconnectingDevice, setDisconnectingDevice] = useState(false);
  const disconnectingDeviceRef = useRef(false);
  const [disconnectConfirmOpen, setDisconnectConfirmOpen] = useState(false);
  const [lastDeviceWarningOpen, setLastDeviceWarningOpen] = useState(false);
  const [devices, setDevices] = useState<LinkedDevice[] | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [manageDevicesOpen, setManageDevicesOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<LinkedDevice | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renamingDevice, setRenamingDevice] = useState(false);
  const renamingDeviceRef = useRef(false);
  const legacyRenamePromptedRef = useRef(false);
  const [remoteDisconnectTarget, setRemoteDisconnectTarget] = useState<LinkedDevice | null>(null);
  const [disconnectingOtherDevice, setDisconnectingOtherDevice] = useState(false);
  const disconnectingOtherDeviceRef = useRef(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const deletingAccountRef = useRef(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const linkedDevices = await listLinkedDevices();
      setDevices(linkedDevices);
      return linkedDevices;
    } catch (err) {
      console.error("Failed to load linked devices:", err);
      toast.error("Failed to load connected devices. Please try again.");
      return null;
    } finally {
      setLoadingDevices(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!devices || legacyRenamePromptedRef.current) return;
    const currentDevice = devices.find((device) => device.isCurrentDevice);
    if (!currentDevice || currentDevice.name) return;
    legacyRenamePromptedRef.current = true;
    setRenameTarget(currentDevice);
    setRenameDraft("");
  }, [devices]);

  async function handleSaveName() {
    if (savingNameRef.current) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === firstName) return;
    savingNameRef.current = true;
    setSavingName(true);
    try {
      await saveFirstName(effectiveUserId, trimmed);
      toast.success("Display name updated.");
    } catch (err) {
      console.error("Failed to save display name:", err);
      toast.error("Failed to save display name. Please try again.");
    } finally {
      savingNameRef.current = false;
      setSavingName(false);
    }
  }

  async function handleReveal() {
    if (revealingRef.current) return;
    revealingRef.current = true;
    setRevealing(true);
    try {
      let code = await getRecoveryCode(effectiveUserId);
      if (!code) {
        code = await rotateRecoveryCode(effectiveUserId);
        toast.success("Recovery code generated.");
      }
      setRevealedCode(code);
      setRevealTitle("Reveal Code");
    } catch (err) {
      console.error("Failed to reveal recovery code:", err);
      toast.error("Failed to load recovery code.");
    } finally {
      revealingRef.current = false;
      setRevealing(false);
    }
  }

  async function handleRotate() {
    if (rotatingRef.current) return;
    rotatingRef.current = true;
    setRotating(true);
    try {
      const newCode = await rotateRecoveryCode(effectiveUserId);
      setRevealedCode(newCode);
      toast.success("Recovery code rotated. Write down your new code.");
    } catch (err) {
      console.error("Failed to rotate recovery code:", err);
      toast.error("Failed to rotate recovery code. Please try again.");
    } finally {
      rotatingRef.current = false;
      setRotating(false);
    }
  }

  async function handleCopyRecoveryCode() {
    if (!revealedCode) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(revealedCode);
      toast.success("Recovery code copied.");
    } catch (err) {
      console.error("Failed to copy recovery code:", err);
      toast.error("Failed to copy recovery code. Please copy it manually.");
    }
  }

  async function handleDisconnectDevice(confirmLastDevice = false) {
    if (disconnectingDeviceRef.current) return;
    disconnectingDeviceRef.current = true;
    setDisconnectingDevice(true);
    try {
      await disconnect(confirmLastDevice);
    } catch (err) {
      if (err instanceof LastDeviceDisconnectError) {
        setLastDeviceWarningOpen(true);
        return;
      }
      console.error("Failed to disconnect device:", err);
      toast.error("Failed to disconnect device. Please try again.");
    } finally {
      disconnectingDeviceRef.current = false;
      setDisconnectingDevice(false);
    }
  }

  async function handleOpenManageDevices() {
    const linkedDevices = devices ?? (await loadDevices());
    if (linkedDevices) setManageDevicesOpen(true);
  }

  function openRenameDevice(device: LinkedDevice) {
    setRenameTarget(device);
    setRenameDraft(device.name ?? "");
  }

  async function handleRenameDevice() {
    if (!renameTarget || renamingDeviceRef.current || !renameDraft.trim()) return;
    renamingDeviceRef.current = true;
    setRenamingDevice(true);
    try {
      const name = renameDraft.trim();
      await renameLinkedDevice(renameTarget.uid, name);
      setDevices(
        (current) =>
          current?.map((device) =>
            device.uid === renameTarget.uid ? { ...device, name } : device
          ) ?? current
      );
      setRenameTarget(null);
      setRenameDraft("");
      toast.success("Device name updated.");
    } catch (err) {
      console.error("Failed to rename device:", err);
      toast.error("Failed to rename device. Please try again.");
    } finally {
      renamingDeviceRef.current = false;
      setRenamingDevice(false);
    }
  }

  async function handleDisconnectOtherDevice() {
    if (!remoteDisconnectTarget || disconnectingOtherDeviceRef.current) return;
    disconnectingOtherDeviceRef.current = true;
    setDisconnectingOtherDevice(true);
    try {
      await disconnectOtherDevice(remoteDisconnectTarget.uid);
      setDevices(
        (current) =>
          current?.filter((device) => device.uid !== remoteDisconnectTarget.uid) ?? current
      );
      setRemoteDisconnectTarget(null);
      toast.success("Device unlinked and recovery code rotated.");
    } catch (err) {
      console.error("Failed to unlink device:", err);
      toast.error("Failed to unlink device. Please try again.");
    } finally {
      disconnectingOtherDeviceRef.current = false;
      setDisconnectingOtherDevice(false);
    }
  }

  async function handleDeleteAccount() {
    if (deletingAccountRef.current) return;
    deletingAccountRef.current = true;
    setDeletingAccount(true);
    try {
      await deleteCurrentAccount();
    } catch (err) {
      console.error("Failed to delete account:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete account. Please try again."
      );
    } finally {
      deletingAccountRef.current = false;
      setDeletingAccount(false);
    }
  }

  const settingsBusy =
    savingName ||
    revealing ||
    rotating ||
    renamingDevice ||
    disconnectingDevice ||
    disconnectingOtherDevice ||
    deletingAccount;
  const childModalOpen =
    editNameOpen ||
    revealedCode !== null ||
    manageDevicesOpen ||
    renameTarget !== null ||
    remoteDisconnectTarget !== null ||
    disconnectConfirmOpen ||
    lastDeviceWarningOpen ||
    deleteConfirmOpen;

  return (
    <ModalShell
      ariaLabel="Settings"
      onClose={() => !settingsBusy && onClose()}
      suspended={childModalOpen}
      className="min-h-0 max-h-[85vh] max-w-md flex flex-col overflow-hidden"
      viewportAware
    >
      <ModalHeader title="Settings" onClose={() => !settingsBusy && onClose()} />
      <div className="min-h-0 flex-1 divide-y divide-slate-700 overflow-y-auto px-4 lg:px-6">
        {/* ── Display Name ───────────────────────────────────────────────── */}
        <section className={settingsRowClass}>
          <div>
            <span className="flex items-center gap-1.5">
              <span className={settingsLabelClass}>Edit Display Name</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title="Edit Display Name"
                  content="Shown on your dashboard and character sheets. If you DM a campaign, it's also shown to your players as the GM's name."
                />
              </span>
            </span>
          </div>
          <EditButton
            label="Edit display name"
            className="justify-self-end"
            onClick={() => setEditNameOpen(true)}
          />
        </section>

        {editNameOpen && (
          <PickerModal
            title="Edit Display Name"
            query=""
            onQueryChange={() => undefined}
            onClose={() => !savingName && setEditNameOpen(false)}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
          >
            <PickerBody>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void (async () => {
                    await handleSaveName();
                    setEditNameOpen(false);
                  })();
                }}
              >
                <input
                  id="settings-first-name"
                  type="text"
                  aria-label="First Name"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(formatFirstNameInput(e.target.value))}
                  placeholder="e.g. David"
                  disabled={savingName}
                  maxLength={PRODUCT_LIMITS.firstNameCharacters}
                  className={`${editableInputClass(true)} min-w-0 flex-1`}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={savingName || !nameDraft.trim() || nameDraft.trim() === firstName}
                >
                  {savingName ? "Saving…" : "Save"}
                </Button>
              </form>
            </PickerBody>
          </PickerModal>
        )}

        {/* ── Recovery Code ───────────────────────────────────────────────── */}
        <section className={settingsRowClass}>
          <div>
            <span className="flex items-center gap-1.5">
              <span className={settingsLabelClass}>View Account Recovery Code</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title="View Account Recovery Code"
                  content="Use this code to reconnect to your campaigns and characters if no device is still connected. Keep it somewhere safe and private."
                />
              </span>
            </span>
          </div>
          <ViewButton
            label="Reveal recovery code"
            className="justify-self-end"
            onClick={handleReveal}
            disabled={revealing}
          />
        </section>

        {revealedCode && (
          <PickerModal
            title={revealTitle}
            query=""
            onQueryChange={() => undefined}
            onClose={() => setRevealedCode(null)}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
            suspended={rotateConfirmOpen}
            footer={
              revealTitle === "Save New Recovery Code" ? (
                <Button variant="primary" fullWidth onClick={() => void handleCopyRecoveryCode()}>
                  Copy recovery code
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="primary" onClick={() => void handleCopyRecoveryCode()}>
                    Copy code
                  </Button>
                  <Button variant="ghost" onClick={() => setRotateConfirmOpen(true)}>
                    Rotate Code
                  </Button>
                </div>
              )
            }
          >
            <PickerBody>
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-center">
                <span className="font-code [font-feature-settings:'zero'] text-lg lg:text-xl text-white tracking-widest break-all select-all">
                  {revealedCode}
                </span>
              </div>
              <p className={`text-xs lg:text-sm ${colourAmberPlain} text-center`}>
                {revealTitle === "Save New Recovery Code"
                  ? "The previous code no longer works. Save this new code somewhere safe before closing."
                  : "If anyone else may have seen this code, rotate it now to invalidate it."}
              </p>
            </PickerBody>
          </PickerModal>
        )}

        {rotateConfirmOpen && (
          <PickerModal
            title="Rotate Code"
            query=""
            onQueryChange={() => undefined}
            onClose={() => !rotating && setRotateConfirmOpen(false)}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
            footer={
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  disabled={rotating}
                  onClick={async () => {
                    await handleRotate();
                    setRotateConfirmOpen(false);
                  }}
                >
                  {rotating ? "Rotating…" : "Yes, rotate"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={rotating}
                  onClick={() => setRotateConfirmOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            }
          >
            <PickerBody>
              <p className="text-sm lg:text-base text-slate-300">
                Rotate code? A new one is generated and the old one stops working immediately.
              </p>
            </PickerBody>
          </PickerModal>
        )}

        {/* ── Manage Devices ──────────────────────────────────────────────── */}
        <section className={settingsRowClass}>
          <div>
            <span className="flex items-center gap-1.5">
              <span className={settingsLabelClass}>Manage Devices</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title="Manage Devices"
                  content="View and rename every device connected to your account, or unlink a device you no longer use. Unlinking another device also rotates your recovery code."
                />
              </span>
            </span>
          </div>
          <ManageDevicesButton
            label="Manage devices"
            className="justify-self-end"
            onClick={() => void handleOpenManageDevices()}
            disabled={loadingDevices}
          />
        </section>

        {manageDevicesOpen && devices && (
          <PickerModal
            title="Manage Devices"
            query=""
            onQueryChange={() => undefined}
            onClose={() => setManageDevicesOpen(false)}
            isEmpty={devices.length === 0}
            emptyMessage="No connected devices found."
            hideSearch
            maxWidth="max-w-lg"
            suspended={
              renameTarget !== null ||
              remoteDisconnectTarget !== null ||
              disconnectConfirmOpen ||
              lastDeviceWarningOpen
            }
          >
            <PickerBody>
              {devices.map((device) => (
                <div
                  key={device.uid}
                  className="rounded-lg border border-slate-700 bg-slate-900/40 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-100">
                        {device.name ?? "Unnamed device"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                        {device.linkedAt
                          ? `Linked ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(device.linkedAt)}`
                          : "Link date unavailable"}
                      </p>
                      {device.isCurrentDevice && (
                        <p className="mt-1 text-xs text-sky-300 lg:text-sm">Current device</p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <EditButton
                        label={`Rename ${device.name ?? "unnamed device"}`}
                        onClick={() => openRenameDevice(device)}
                      />
                      <UnlinkButton
                        label={`Unlink ${device.name ?? "unnamed device"}`}
                        onClick={() => {
                          if (device.isCurrentDevice) {
                            if (devices.length === 1) setLastDeviceWarningOpen(true);
                            else setDisconnectConfirmOpen(true);
                          } else {
                            setRemoteDisconnectTarget(device);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </PickerBody>
          </PickerModal>
        )}

        {renameTarget && (
          <PickerModal
            title={renameTarget.name ? "Rename Device" : "Name This Device"}
            query=""
            onQueryChange={() => undefined}
            onClose={() => {
              if (renamingDevice) return;
              setRenameTarget(null);
              setRenameDraft("");
            }}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
          >
            <PickerBody>
              {!renameTarget.name && (
                <p className="text-sm text-slate-300 lg:text-base">
                  Give this device a name so you can recognise it in your connected devices list.
                </p>
              )}
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleRenameDevice();
                }}
              >
                <label htmlFor="settings-device-name" className="sr-only">
                  Device name
                </label>
                <input
                  id="settings-device-name"
                  type="text"
                  value={renameDraft}
                  onChange={(event) => setRenameDraft(event.target.value)}
                  disabled={renamingDevice}
                  maxLength={PRODUCT_LIMITS.deviceNameCharacters}
                  placeholder="e.g. Cormac's phone"
                  autoComplete="off"
                  className={editableInputClass(true)}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={
                      renamingDevice ||
                      !renameDraft.trim() ||
                      renameDraft.trim() === renameTarget.name
                    }
                  >
                    {renamingDevice ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={renamingDevice}
                    onClick={() => {
                      setRenameTarget(null);
                      setRenameDraft("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </PickerBody>
          </PickerModal>
        )}

        {remoteDisconnectTarget && (
          <PickerModal
            title="Unlink Device?"
            query=""
            onQueryChange={() => undefined}
            onClose={() => !disconnectingOtherDevice && setRemoteDisconnectTarget(null)}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
            footer={
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  disabled={disconnectingOtherDevice}
                  onClick={() => void handleDisconnectOtherDevice()}
                >
                  {disconnectingOtherDevice ? "Unlinking…" : "Yes, unlink"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={disconnectingOtherDevice}
                  onClick={() => setRemoteDisconnectTarget(null)}
                >
                  Cancel
                </Button>
              </div>
            }
          >
            <PickerBody>
              <p className="text-sm text-slate-300 lg:text-base">
                Unlink {remoteDisconnectTarget.name ?? "this device"}? It will return to Create Your
                Account and lose access to this account. Your recovery code will be replaced, and
                the new code will be shown next.
              </p>
            </PickerBody>
          </PickerModal>
        )}

        {disconnectConfirmOpen && (
          <PickerModal
            title="Unlink This Device?"
            query=""
            onQueryChange={() => undefined}
            onClose={() => !disconnectingDevice && setDisconnectConfirmOpen(false)}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
            footer={
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="primary"
                  disabled={disconnectingDevice}
                  onClick={async () => {
                    await handleDisconnectDevice(false);
                    setDisconnectConfirmOpen(false);
                  }}
                >
                  {disconnectingDevice ? "Unlinking…" : "Yes, unlink"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={disconnectingDevice}
                  onClick={() => setDisconnectConfirmOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            }
          >
            <PickerBody>
              <p className="text-sm lg:text-base text-slate-300">
                Your campaigns and characters remain in the account and stay available on every
                other connected device. You can reconnect this device later using your account
                recovery code.
              </p>
            </PickerBody>
          </PickerModal>
        )}

        <section className={settingsRowClass}>
          <div>
            <span className="flex items-center gap-1.5">
              <span className={settingsLabelClass}>Delete Account</span>
              <span className={uiInfoModalWrapper}>
                <InfoModal
                  title="Delete Account"
                  content="This releases your claimed characters, removes your profile and linked devices, revokes account recovery, and permanently deletes this anonymous account. You must delete or transfer every campaign you own first."
                />
              </span>
            </span>
          </div>
          <RemoveButton
            label="Delete account"
            className="justify-self-end"
            onClick={() => setDeleteConfirmOpen(true)}
          />
        </section>

        {deleteConfirmOpen && (
          <PickerModal
            title="Delete Account"
            query=""
            onQueryChange={() => undefined}
            onClose={() => {
              if (deletingAccount) return;
              setDeleteConfirmOpen(false);
              setDeleteConfirmText("");
            }}
            isEmpty={false}
            hideSearch
            maxWidth="max-w-sm"
            footer={
              <div className="space-y-2">
                <p className={`text-xs lg:text-sm ${colourAmberPlain} text-center`}>
                  Type DELETE to permanently delete this account
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={deletingAccount}
                  placeholder="DELETE"
                  className={editableInputClass(true)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    disabled={deletingAccount || deleteConfirmText !== "DELETE"}
                    onClick={async () => {
                      await handleDeleteAccount();
                      setDeleteConfirmOpen(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    {deletingAccount ? "Deleting…" : "Delete permanently"}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={deletingAccount}
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setDeleteConfirmText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            }
          >
            <PickerBody>
              <p className="text-sm lg:text-base text-slate-300">
                This permanently deletes your account. This cannot be undone.
              </p>
            </PickerBody>
          </PickerModal>
        )}
      </div>

      {lastDeviceWarningOpen && (
        <ModalShell
          ariaLabel="Unlink Last Device"
          onClose={() => !disconnectingDevice && setLastDeviceWarningOpen(false)}
          className="max-w-lg"
        >
          <ModalHeader
            title="Unlink Last Device"
            onClose={() => !disconnectingDevice && setLastDeviceWarningOpen(false)}
          />
          <div className="space-y-4 p-4 lg:p-5">
            <p className="text-sm text-slate-300 lg:text-base">
              This is the last connected device. Make sure you have saved your recovery code or you
              will lose access to this account.
            </p>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4">
              <Button
                variant="neutral"
                onClick={() => setLastDeviceWarningOpen(false)}
                disabled={disconnectingDevice}
              >
                Keep connected
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleDisconnectDevice(true)}
                disabled={disconnectingDevice}
              >
                {disconnectingDevice ? "Unlinking…" : "Unlink anyway"}
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </ModalShell>
  );
}
