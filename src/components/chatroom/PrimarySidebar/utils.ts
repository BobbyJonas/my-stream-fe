export interface ISidebarWidgetItem {
  enabled?: boolean;
  name: string;
  label: string;
  icon: string;
}

export const BuiltinSidebarWidgetList: Array<ISidebarWidgetItem> = [
  { name: "TextChatbox", label: "文字聊天", icon: "chat-left-dots-fill", enabled: true },
  { name: "Member", label: "成员", icon: "people-fill", enabled: true },
  { name: "FileShare", label: "文件共享", icon: "folder-fill", enabled: true },
];

export default {};
