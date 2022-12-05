export const extensions = [
  {
    name: "pitch",
    type: "audio",
    registry: [
      {
        key: "content/bar",
        icon: "",
      },
    ],
    src: require("./audio/pitch"),
  },
  {
    name: "blur",
    type: "video",
    registry: [
      {
        key: "content/bar",
        icon: "",
      },
    ],
    src: require("./video/blur/index.ts"),
  },
];

export default {};
