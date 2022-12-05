import { extensions } from "..";

const audioExtensions = extensions?.filter(item => item.type === "audio") || [];

export type NodeListItemType = {
  name: string;
  node: AudioNode;
};

export class AudioNodeList {
  public stream: MediaStream;
  public context: AudioContext;

  private nodeList: NodeListItemType[] = [];
  public extensionNodeMap: Record<string, any> = {};

  private settings: Record<string, any> = {
    input: {},
    delay: {
      delayTime: 0,
    },
    pitch: { offset: 0 },
    gain: {
      gain: 0.5,
    },
    compressor: {},
    streamDestination: {},
  };

  constructor(stream: MediaStream, context: AudioContext) {
    this.stream = stream;
    this.context = context;
    this.createNodes();
  }

  public createNodes(): void {
    if (!this.context) return;

    const processNodeNameList: string[] = [];

    processNodeNameList.unshift("input");

    for (let i = 0; i < audioExtensions.length; i++) {
      const { type, name, src = {} } = audioExtensions[i];

      if (type === "audio") {
        const { default: ExtensionNode } = src;
        const extensionNodeInstance = new ExtensionNode(this.context, processNodeNameList);
        this.extensionNodeMap[name] = extensionNodeInstance;
        this.settings[name] = extensionNodeInstance.generatePresets();
      }
    }

    processNodeNameList.push("compressor");
    // processNodeNameList.push("destination");
    processNodeNameList.push("streamDestination");

    let resultIndex = -1;
    const resultNodeList: NodeListItemType[] = [];

    for (let processIndex = 0; processIndex < processNodeNameList.length; processIndex++) {
      const nodeName = processNodeNameList[processIndex];
      const nodeItem: NodeListItemType = { name: nodeName } as any;

      const nodeSettings = { ...(this.settings[nodeName] || {}) };

      switch (nodeName) {
        case "input":
          nodeItem.node = this.context.createMediaStreamSource(this.stream);
          break;
        case "delay":
          nodeItem.node = this.context.createDelay(5);
          (nodeItem.node as DelayNode).delayTime.value = nodeSettings.delayTime || 0;
          break;
        case "gain":
          nodeItem.node = this.context.createGain();
          (nodeItem.node as GainNode).gain.value = nodeSettings.gain;
          break;
        case "compressor":
          nodeItem.node = this.context.createDynamicsCompressor();
          break;
        case "streamDestination":
          nodeItem.node = this.context.createMediaStreamDestination();
          break;
        case "destination":
          nodeItem.node = this.context.destination;
          break;
        default:
          nodeItem.node = this.extensionNodeMap[nodeName] as any;
          (nodeItem.node as any)?.applyPresets?.(nodeSettings);
          break;
      }

      if (nodeItem.node) {
        resultIndex++;
        resultNodeList.push(nodeItem);
      }

      if (resultIndex > 0) {
        // connect mediaStreamDestination to the node before destination (compressor)
        let prevIndex = resultIndex - 1;
        if (resultNodeList[prevIndex].name === "destination") prevIndex--;
        resultNodeList[prevIndex].node.connect(
          (resultNodeList[resultIndex].node as any)?.input || resultNodeList[resultIndex].node
        );
      }
    }

    this.nodeList = resultNodeList;
    this.stream = (
      this.nodeList[this.nodeList.length - 1]?.node as MediaStreamAudioDestinationNode
    )?.stream;
  }
}

export default {};
