import {
  PanelElementType,
  SERIALIZATION_VERSION,
  normalizePanelModel,
  type PanelElement,
  type PanelModel,
  type PanelModelInput,
  type PanelOptions,
  type SerializedPanel,
  type Vector2
} from './panelTypes';

export class SerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SerializationError';
  }
}

export function serializePanelModel(model: PanelModel): string {
  const payload: SerializedPanel = {
    version: SERIALIZATION_VERSION,
    model
  };

  return JSON.stringify(payload);
}

export function parseSerializedPanel(
  payload: string | SerializedPanel
): SerializedPanel {
  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;

  if (!isSerializedPanel(parsed)) {
    throw new SerializationError('Payload does not match the panel schema');
  }

  return {
    version: parsed.version,
    model: normalizePanelModel(parsed.model as PanelModelInput)
  };
}

export function deserializePanelModel(
  payload: string | SerializedPanel
): PanelModel {
  return parseSerializedPanel(payload).model;
}

function isSerializedPanel(value: unknown): value is SerializedPanel {
  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as SerializedPanel).version !== 'number' ||
    !(value as SerializedPanel).model
  ) {
    return false;
  }

  const { version, model } = value as SerializedPanel;
  if (version > SERIALIZATION_VERSION) {
    return false;
  }

  if (version >= 2) {
    return isPanelModel(model);
  }

  return isPanelModelInput(model);
}

function isPanelModelInput(value: unknown): value is PanelModelInput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as PanelModelInput;
  if (!candidate.dimensions || !candidate.options || !candidate.elements) {
    return false;
  }

  const { dimensions } = candidate;
  if (
    typeof dimensions.widthCm !== 'number' ||
    typeof dimensions.widthMm !== 'number' ||
    typeof dimensions.widthHp !== 'number' ||
    typeof dimensions.heightMm !== 'number'
  ) {
    return false;
  }

  if (!isPanelOptions(candidate.options)) {
    return false;
  }

  if (!Array.isArray(candidate.elements)) {
    return false;
  }

  if (!Array.isArray(candidate.elements)) {
    return false;
  }

  return candidate.elements.every(isPanelElement);
}

function isPanelModel(value: unknown): value is PanelModel {
  if (!isPanelModelInput(value)) {
    return false;
  }
  const candidate = value as PanelModel;
  return Boolean(candidate.mountingHoleConfig) && isMountingHoleConfig(candidate.mountingHoleConfig);
}

function isPanelOptions(value: unknown): value is PanelOptions {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const options = value as PanelOptions;
  return (
    typeof options.showGrid === 'boolean' &&
    typeof options.showMountingHoles === 'boolean' &&
    typeof options.snapToGrid === 'boolean' &&
    typeof options.gridSizeMm === 'number'
  );
}

function isPanelElement(value: unknown): value is PanelElement {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const element = value as PanelElement;
  return (
    typeof element.id === 'string' &&
    typeof element.type === 'string' &&
    Object.values(PanelElementType).includes(element.type) &&
    isVector2(element.positionMm) &&
    typeof element.properties === 'object' &&
    element.properties !== null
  );
}

function isVector2(value: unknown): value is Vector2 {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const vector = value as Vector2;
  return typeof vector.x === 'number' && typeof vector.y === 'number';
}

function isMountingHoleConfig(value: unknown): value is PanelModel['mountingHoleConfig'] {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const config = value as PanelModel['mountingHoleConfig'];
  return (
    typeof config.diameterMm === 'number' &&
    typeof config.horizontalOffsetMm === 'number' &&
    typeof config.verticalOffsetMm === 'number' &&
    typeof config.spacingHp === 'number' &&
    typeof config.slotLengthMm === 'number' &&
    (config.shape === 'circle' || config.shape === 'slot')
  );
}
