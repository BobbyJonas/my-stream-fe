import Jungle from "./jungle";

export interface PitchNodePresetsType {
  offset: number;
}

export const widgetName = "pitch";

export class PitchNode {
  private jungleInstance: Jungle;
  public input: GainNode;
  public output: GainNode;

  constructor(context: AudioContext, nodeNameList: string[]) {
    this.jungleInstance = new Jungle(context);
    this.input = this.jungleInstance.input;
    this.output = this.jungleInstance.output;

    nodeNameList.push(widgetName);
  }

  public connect(node: AudioNode): void {
    this.jungleInstance.output.connect(node);
  }

  private setPitchOffset(mult: number): void {
    this.jungleInstance.setPitchOffset(mult);
  }

  public generatePresets(): Partial<PitchNodePresetsType> {
    return {
      offset: 0,
    };
  }

  public applyPresets(presets: PitchNodePresetsType): void {
    this.setPitchOffset(presets.offset);
  }
}

export default PitchNode;
