/* eslint-disable no-lonely-if */
import Tuna from "tunajs";
import _ from "lodash";
import { Jungle } from "~/assets/utils/jungle";

const NodeNameList = [
  "delay",
  "tunachorus",
  "tunawahwah",
  "tunaoverdrive",
  "tunaphaser",
  "tunatremolo",
  "pitch",
  "gain",
  "compressor",
  "destination",
  "streamDestination",
] as const;

type NodeNameType = typeof NodeNameList[number];
type NodePresetType = {
  [k in NodeNameType]?: Record<string, any> & { connected: boolean };
};
type AudioNodeType = (AudioNode | Jungle) & { connected?: boolean };
type NodeListItemType = {
  name: string;
  node: AudioNodeType;
};

export class AudioNodes {
  public stream: MediaStream | null = null;
  public context: AudioContext | null = null;
  private nodes: NodeListItemType[] = [];

  public pitchJungle: Jungle | null = null;

  private nodeDefaultSettings = {
    input: {
      connected: true, // this is just an indicator, but it does not have any effect on the actual connection status
    },
    delay: {
      connected: true,
      delayTime: 0,
    },
    tunachorus: {
      connected: true,
      rate: 8, // 0.01 to 8+
      feedback: 0.85, // 0 to 1+
      delay: 0.00045, // 0 to 1
      bypass: false, // the value 1 starts the effect as bypassed, 0 or 1
    },
    tunawahwah: {
      connected: true,
      automode: true, // true/false
      baseFrequency: 0.5, // 0 to 1
      excursionOctaves: 2, // 1 to 6
      sweep: 1, // 0 to 1
      resonance: 10, // 1 to 100
      sensitivity: 0.5, // -1 to 1
      bypass: false,
    },
    tunaoverdrive: {
      connected: true,
      outputGain: 0.5, // 0 to 1+
      drive: 0.7, // 0 to 1
      curveAmount: 1, // 0 to 1
      algorithmIndex: 5, // 0 to 5, selects one of our drive algorithms
      bypass: 0,
    },
    tunaphaser: {
      connected: true,
      rate: 8, // 0.01 to 8 is a decent range, but higher values are possible
      depth: 0.3, // 0 to 1
      feedback: 0.5, // 0 to 1+
      stereoPhase: 100, // 0 to 180
      baseModulationFrequency: 700, // 500 to 1500
      bypass: 0,
    },
    tunatremolo: {
      connected: true,
      intensity: 1, // 0 to 1
      rate: 8, // 0.001 to 8
      stereoPhase: 180, // 0 to 180
      bypass: false,
    },
    pitch: { connected: true, offset: 0 },
    gain: {
      connected: true,
      gain: 0.5,
    },
    compressor: {
      connected: true,
    },
    destination: {
      connected: true,
    },
    streamDestination: {
      connected: true,
    },
  };

  public funcPresets: Record<string, NodePresetType> = {
    clearSound: {
      delay: { connected: false },
      tunachorus: { connected: false },
      tunawahwah: { connected: false },
      tunaoverdrive: { connected: false },
      tunaphaser: { connected: false },
      tunatremolo: { connected: false },
      gain: {
        connected: true,
        gain: {
          value: 0.5,
        },
      },
    },
    pitchHigh: {
      delay: { connected: false },
      tunachorus: { connected: false },
      tunawahwah: { connected: false },
      tunaoverdrive: { connected: false },
      tunaphaser: { connected: false },
      tunatremolo: { connected: false },
      pitch: { connected: false, offset: 1 },
      gain: {
        connected: true,
        gain: {
          value: 0.5,
        },
      },
    },
    underWater: {
      delay: {
        connected: false,
      },
      tunachorus: {
        connected: true,
        feedback: 0.25,
      },
      tunawahwah: {
        connected: false,
        baseFrequency: 0,
        excursionOctaves: 1,
        resonance: 100,
        sensitivity: 0.5,
      },
      tunaoverdrive: {
        connected: false,
      },
      tunatremolo: {
        connected: false,
      },
      gain: {
        connected: true,
        gain: {
          value: 0.9,
        },
      },
    },
    spaceSignal: {
      delay: {
        connected: false,
      },
      tunachorus: {
        connected: true,
        feedback: 0.85,
        delay: 0.004,
      },
      tunawahwah: {
        connected: true,
        baseFrequency: 0.8,
        excursionOctaves: 3,
        resonance: 10,
        sensitivity: 0.8,
      },
      tunaoverdrive: {
        connected: false,
      },
      tunatremolo: {
        connected: false,
      },
      gain: {
        connected: true,
        gain: {
          value: 0.5,
        },
      },
    },
    brokenRadio: {
      delay: {
        connected: false,
      },
      tunachorus: {
        connected: false,
      },
      tunawahwah: {
        connected: false,
      },
      tunaoverdrive: {
        connected: true,
        drive: 0.7,
        algorithmIndex: 1,
      },
      tunatremolo: {
        connected: true,
        intensity: 0.2,
        rate: 8,
        stereoPhase: 8,
        bypass: false,
      },
      gain: {
        connected: true,
        gain: {
          value: 0.3,
        },
      },
      compressor: {
        connected: true,
      },
      destination: {
        connected: true,
      },
      streamDestination: {
        connected: true,
      },
    },
  };

  private GetNodeInput(index: number, _nodeList: NodeListItemType[]): AudioNode {
    const nodeList = _nodeList || this.nodes;
    const item = nodeList[index].node;
    if ((item as Jungle)?.input) return (item as Jungle).input;
    return item as AudioNode;
  }

  private GetNodeOutput(index: number, _nodeList: NodeListItemType[]): AudioNode {
    const nodeList = _nodeList || this.nodes;
    const item = nodeList[index].node;
    if ((item as Jungle)?.output) return (item as Jungle).output;
    return item as AudioNode;
  }

  public createNodes(stream: MediaStream, _nodeNameList: string[] = []) {
    // if no extra nodes were provided default to an empty array
    if (!this.context) return;
    const nodeNameList = [..._nodeNameList];

    const newNodeList: NodeListItemType[] = [];
    let tunaInstance;
    // if any tuna nodes are given as arguments then initialize tuna
    for (let i = 0; i < nodeNameList.length; i++) {
      if (/tuna/.test(nodeNameList[i])) {
        tunaInstance = new Tuna(this.context);
        break;
      }
    }

    const pushIfNotExists = (name: string): void => {
      const index = nodeNameList.indexOf(name);
      if (index < 0) nodeNameList.push(name);
    };

    const removeAndPush = (name: string): void => {
      const index = nodeNameList.indexOf(name);
      if (index >= 0) {
        nodeNameList.splice(index, 1);
        nodeNameList.push(name);
      } else {
        nodeNameList.push(name);
      }
    };
    // add the default nodes to the array of nodes' names
    nodeNameList.unshift("input");
    pushIfNotExists("gain");
    removeAndPush("compressor");
    // removeAndPush("destination");
    removeAndPush("streamDestination");

    // create the audio nodes based on the nodes names array
    // set the settings to default
    const settings = this.nodeDefaultSettings;

    for (let i = 0; i < nodeNameList.length; i++) {
      const nodeName = nodeNameList[i];
      const nodeSettings = { ...(settings[nodeName] || {}) };
      delete nodeSettings.connected;

      const currentNodeItem: NodeListItemType = { name: nodeName, node: {} as any };

      switch (nodeName) {
        case "input":
          // only output audio
          currentNodeItem.node = this.context.createMediaStreamSource(stream);
          break;
        case "delay":
          // max delay time is 5 seconds
          currentNodeItem.node = this.context.createDelay(5);
          (currentNodeItem.node as DelayNode).delayTime.value = settings.delay.delayTime || 0;
          break;
        case "gain":
          currentNodeItem.node = this.context.createGain();
          // default gain value
          (currentNodeItem.node as GainNode).gain.value = nodeSettings.gain;
          break;
        case "tunachorus":
          currentNodeItem.node = new tunaInstance.Chorus(nodeSettings);
          break;
        case "tunawahwah":
          currentNodeItem.node = new tunaInstance.WahWah(nodeSettings);
          break;
        case "tunaphaser":
          currentNodeItem.node = new tunaInstance.Phaser(nodeSettings);
          break;
        case "tunaoverdrive":
          currentNodeItem.node = new tunaInstance.Overdrive(nodeSettings);
          break;
        case "tunatremolo":
          currentNodeItem.node = new tunaInstance.Tremolo(nodeSettings);
          break;
        case "pitch":
          currentNodeItem.node = this.pitchJungle as Jungle;
          this.pitchJungle?.setPitchOffset(nodeSettings.offset);
          break;
        case "compressor":
          currentNodeItem.node = this.context.createDynamicsCompressor();
          break;
        case "streamDestination":
          currentNodeItem.node = this.context.createMediaStreamDestination();
          break;
        case "destination":
          currentNodeItem.node = this.context.destination;
          break;
        default:
          return;
      }
      currentNodeItem.node.connected = nodeSettings.connected;
      newNodeList.push(currentNodeItem);

      // connect the nodes
      if (i > 0) {
        // connect mediaStreamDestination to the node before destination (compressor)
        if (newNodeList[i].name === "streamDestination") {
          const prevIndex = newNodeList[i - 1].name === "destination" ? i - 2 : i - 1;
          this.GetNodeOutput(prevIndex, newNodeList).connect(this.GetNodeInput(i, newNodeList));
        } else {
          this.GetNodeOutput(i - 1, newNodeList).connect(this.GetNodeInput(i, newNodeList));
        }
      }
    }
    this.nodes = newNodeList;
  }

  private nodeSwitch(nodeToSwitch: NodeListItemType) {
    // get the previous and next connected nodes in the audio graph
    // look for a node which is connected and brake

    const nodeIndex = this.nodes.findIndex(item => item.name === nodeToSwitch.name);
    let previousNode: AudioNodeType | null = null;
    let nextNode: AudioNodeType | null = null;
    for (let i = 1; i < this.nodes.length; i++) {
      if (nodeIndex - i < 0) break;
      if (this.nodes[nodeIndex - i].node?.connected) {
        previousNode = this.nodes[nodeIndex - i].node || null;
        break;
      }
    }
    for (let i = 1; i < this.nodes.length; i++) {
      if (nodeIndex + i >= this.nodes.length) return;
      if (this.nodes[nodeIndex + i].node?.connected) {
        nextNode = this.nodes[nodeIndex + i].node || null;
        break;
      }
    }
    // disconnect the node if its connected, otherwise - connect

    const getNodeInput = (nodeItem: AudioNodeType | null) => {
      if ((nodeItem as Jungle)?.input) return (nodeItem as Jungle).input;
      return (nodeItem || {}) as AudioNode;
    };

    const getNodeOutput = (nodeItem: AudioNodeType | null) => {
      if ((nodeItem as Jungle)?.output) return (nodeItem as Jungle).output;
      return (nodeItem || {}) as AudioNode;
    };

    if (!nodeToSwitch.node?.connected) {
      getNodeOutput(previousNode).disconnect?.(0);
      getNodeOutput(nodeToSwitch?.node).disconnect?.(0);
      getNodeOutput(previousNode).connect?.(getNodeInput(nextNode));
    } else {
      getNodeOutput(previousNode).disconnect?.(0);
      getNodeOutput(previousNode).connect?.(getNodeInput(nodeToSwitch?.node));
      getNodeOutput(nodeToSwitch?.node).connect?.(getNodeInput(nextNode));
    }
    // toggle node's connection state
    nodeToSwitch.node.connected = !nodeToSwitch.node.connected;
  }

  public loadPresets(settings: NodePresetType) {
    // load settings for each of the audio nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i]; // the actual audio node
      const nodeName = node.name; // name of the actual node
      const nodeSettings = settings[nodeName]; // audio node in the settings' object
      // if there were no new settings provided for the current node than jump to the next node
      if (!nodeSettings) continue;
      // if settings require connection, but the actual node is not connected
      const nodeNeedSwitch =
        nodeSettings.connected !== undefined && nodeSettings.connected !== node.node.connected;
      node.node = _.defaultsDeep(settings[nodeName], node.node);
      if (nodeNeedSwitch) this.nodeSwitch(node);
    } // for i
  }

  public constructor(
    _stream: MediaStream,
    _context: AudioContext,
    enableNodeNameList: NodeNameType[]
  ) {
    this.context = _context;
    this.pitchJungle = new Jungle(_context);
    // set settings for different effects combinations of audio nodes
    this.createNodes(_stream, enableNodeNameList);
    // get the stream from MediaStreamDestinationNode
    this.stream = (
      this.nodes[this.nodes.length - 1].node as MediaStreamAudioDestinationNode
    )?.stream;
  }
}

export default {};
