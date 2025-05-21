import { IonIcon } from "@ionic/react";
import { Channel } from "@mattermost/types/channels";
import { useLongPress } from "use-long-press";
import { addOutline, chatbubblesOutline } from "ionicons/icons";
import { useTranslation } from "react-i18next";
import { readableColor } from "color2k";

interface Props {
  chainChannels: Channel[];
  selectedChannel: Channel | null;
  isChainAdmin: boolean;
  isChatEnabled: boolean;
  onSelectChannel: (cr: Channel) => void;
  onOpenCreateChannel: (_: "edit" | "create") => void;
  selectedOldBulkyItems: boolean;
  onSelectOldBulkyItems: () => void;
  onChannelOptionSelect: (value: "delete" | "rename") => void;
  isChannelActionSheetOpen: boolean;
  setIsChannelActionSheetOpen: (_: boolean) => void;
}

export default function ChatRoomSelect({
  chainChannels,
  selectedChannel,
  isChainAdmin,
  isChatEnabled,
  onSelectChannel,
  selectedOldBulkyItems,
  onSelectOldBulkyItems,
  onOpenCreateChannel,
  setIsChannelActionSheetOpen,
}: Props) {
  const { t } = useTranslation();

  const longPressChannel = useLongPress(
    (e) => {
      setIsChannelActionSheetOpen(true);
    },
    {
      onCancel: (e) => {
        setIsChannelActionSheetOpen(false);
      },
    },
  );

  return (
    <div className="tw-shrink-0 w-full tw-flex tw-gap-1 tw-overflow-x-auto tw-bg-light">
      <button
        className={"tw-p-2 tw-flex tw-flex-col tw-items-center tw-group".concat(
          selectedOldBulkyItems ? " tw-bg-light-shade" : "",
        )}
        key="oldBulkyItems"
        onClick={onSelectOldBulkyItems}
      >
        <div
          className={"tw-relative tw-font-bold tw-w-12 tw-h-12 tw-rounded-full tw-bg-blue-tint tw-flex tw-items-center tw-justify-center tw-ring group-hover:tw-ring-blue tw-transition-colors".concat(
            selectedOldBulkyItems
              ? " tw-ring-blue tw-ring-1"
              : " tw-ring-transparent",
          )}
        >
          <span style={{ color: "#000" }}>B</span>
        </div>
        <div
          className={"tw-text-xs tw-text-center tw-truncate tw-mt-1 tw-w-[80px]".concat(
            selectedOldBulkyItems ? " tw-font-bold" : "",
          )}
        >
          {t("bulkyItems")}
        </div>
      </button>

      {isChatEnabled ? (
        chainChannels.map((cr, i) => {
          const initials = cr.display_name
            .split(" ")
            .map((word) => word[0])
            .join("");

          const isSelected = cr.id === selectedChannel?.id;

          const textColor = readableColor(cr.header || "#fff");
          return (
            <button
              className={"tw-p-2 tw-flex tw-flex-col tw-items-center tw-group".concat(
                isSelected ? " tw-bg-light-shade" : "",
              )}
              key={cr.id}
              {...(isSelected
                ? isChainAdmin
                  ? longPressChannel(isSelected)
                  : {}
                : {
                    onClick: () => onSelectChannel(cr),
                  })}
            >
              <div
                style={{ backgroundColor: cr.header || "#fff" }}
                className={"tw-relative tw-font-bold tw-w-12 tw-h-12 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-ring  group-hover:tw-ring-purple tw-transition-colors".concat(
                  isSelected
                    ? " tw-ring-purple tw-ring-1"
                    : " tw-ring-transparent",
                )}
              >
                <span style={{ color: textColor }}>{initials}</span>
              </div>
              <div
                className={"tw-text-xs tw-text-center tw-mt-1".concat(
                  isSelected
                    ? " tw-font-bold tw-whitespace-nowrap"
                    : " tw-truncate tw-max-w-[3.5rem]",
                )}
              >
                {cr.display_name!}
              </div>
            </button>
          );
        })
      ) : (
        // When chat is disabled by loop host
        <div className="tw-p-2 tw-flex tw-flex-col tw-items-center">
          <div className="tw-relative tw-font-bold tw-w-12 tw-h-12 tw-rounded-full tw-bg-light-shade tw-ring tw-ring-warning tw-flex tw-items-center tw-justify-center">
            <IonIcon icon={chatbubblesOutline} className="tw-text-medium" />
          </div>
          <div className="tw-text-xs tw-text-center tw-mt-1 tw-text-medium">
            Chat disabled
          </div>
        </div>
      )}

      {isChainAdmin && isChatEnabled ? (
        <div key="plus" className="tw-p-2 tw-me-4 tw-flex tw-shrink-0">
          <button
            onClick={() => onOpenCreateChannel("create")}
            className="tw-font-bold tw-w-12 tw-h-12 tw-rounded-full tw-bg-light-shade hover:tw-bg-purple-contrast tw-flex tw-items-center tw-justify-center"
          >
            <IonIcon className="tw-text-2xl" src={addOutline} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
