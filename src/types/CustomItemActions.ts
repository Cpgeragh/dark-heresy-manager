import type { CampaignCustomItem, CustomItemCategory } from "./CustomItems";

export type CustomItemLibraryAction = "publish" | "archive" | "updateAll";

export interface BusyCustomItemLibraryAction {
  itemId: string;
  action: CustomItemLibraryAction;
}

export interface CustomItemLibraryActionCallbacks {
  onEditDefinition?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onUpdateAllCopies?: () => void;
}

export interface CustomItemLibraryActionProps<
  TCategory extends CustomItemCategory = CustomItemCategory,
> extends CustomItemLibraryActionCallbacks {
  libraryItem?: CampaignCustomItem<TCategory>;
  isDM?: boolean;
  canEditDefinition?: boolean;
  busyAction?: CustomItemLibraryAction | null;
}
