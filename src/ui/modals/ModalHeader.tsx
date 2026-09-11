// Shared centred header for modal dialogs.

import type { ReactNode } from "react";
import { CloseButton } from "../buttons/CloseButton";
import { TitleHeaderActionButton } from "../buttons/TitleHeaderActionButton";
import { CenteredTitleHeader } from "../CenteredTitleHeader";

interface ModalHeaderProps {
  action?: ReactNode;
  actionAriaLabel?: string;
  className?: string;
  onClose: () => void;
  title: ReactNode;
  titleClassName?: string;
}

export function ModalHeader({
  action,
  actionAriaLabel = "Back",
  className = "",
  onClose,
  title,
  titleClassName,
}: ModalHeaderProps) {
  return (
    <CenteredTitleHeader
      className={className}
      title={title}
      titleClassName={titleClassName}
      right={
        action === undefined ? (
          <CloseButton onClick={onClose} className="justify-self-end" />
        ) : (
          <TitleHeaderActionButton onClick={onClose} aria-label={actionAriaLabel}>
            {action}
          </TitleHeaderActionButton>
        )
      }
    />
  );
}
