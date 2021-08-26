import { SynchronousDataTransformerInfo } from '../../types';
import { map } from 'rxjs/operators';

import { DataTransformerID } from './ids';
import { DataFrame, Field, FieldType } from '../../types/dataFrame';
import { dateTimeParse } from '../../datetime';
import { ArrayVector } from '../../vector';

export interface FieldConvertTypeTransformerOptions {
  conversions: FieldConvertTypeOptions[];
}

export interface FieldConvertTypeOptions {
  targetField: string | undefined;
  destinationType: FieldType | undefined;
  dateFormat?: string;
}

/**
 * @alpha
 */
export const fieldConvertTypeTransformer: SynchronousDataTransformerInfo<FieldConvertTypeTransformerOptions> = {
  id: DataTransformerID.fieldConvertType,
  name: 'Convert field type',
  description: 'Convert a field to a specified field type',
  defaultOptions: {
    fields: {},
    conversions: [{ targetField: undefined, destinationType: undefined, dateFormat: undefined }],
  },

  operator: (options) => (source) => source.pipe(map((data) => fieldConvertTypeTransformer.transformer(options)(data))),

  transformer: (options: FieldConvertTypeTransformerOptions) => (data: DataFrame[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return data;
    }
    const timeParsed = fieldConvertType(options, data);
    if (!timeParsed) {
      return [];
    }
    return timeParsed;
  },
};

/**
 * @alpha
 */
export function fieldConvertType(options: FieldConvertTypeTransformerOptions, frames: DataFrame[]): DataFrame[] {
  if (!options.conversions.length) {
    return frames;
  }

  const frameCopy: DataFrame[] = [];

  frames.forEach((frame) => {
    for (let fieldIdx = 0; fieldIdx < frame.fields.length; fieldIdx++) {
      let field = frame.fields[fieldIdx];
      for (let cIdx = 0; cIdx < options.conversions.length; cIdx++) {
        if (field.name === options.conversions[cIdx].targetField) {
          //check in about matchers with Ryan
          const conversion = options.conversions[cIdx];
          switch (conversion.destinationType) {
            case FieldType.time:
              frame.fields[fieldIdx] = ensureTimeField(field, conversion.dateFormat);
              break;
            case FieldType.number:
              frame.fields[fieldIdx] = fieldToNumberField(field);
              break;
            case FieldType.string:
              frame.fields[fieldIdx] = fieldToStringField(field);
              break;
            case FieldType.boolean:
              frame.fields[fieldIdx] = fieldToBooleanField(field);
              break;
          }
          break;
        }
      }
    }
    frameCopy.push(frame);
  });
  return frameCopy;
}

export function fieldToTimeField(field: Field, dateFormat?: string): Field {
  let opts = dateFormat ? { format: dateFormat } : undefined;

  const timeValues = field.values.toArray().slice();

  for (let t = 0; t < timeValues.length; t++) {
    if (timeValues[t]) {
      let parsed = dateTimeParse(timeValues[t], opts).valueOf();
      timeValues[t] = Number.isFinite(parsed) ? parsed : undefined;
    } else {
      timeValues[t] = undefined;
    }
  }

  return {
    ...field,
    type: FieldType.time,
    values: new ArrayVector(timeValues),
  };
}

function fieldToNumberField(field: Field): Field {
  const numValues = field.values.toArray().slice();

  for (let n = 0; n < numValues.length; n++) {
    if (numValues[n]) {
      let number = +numValues[n];
      numValues[n] = Number.isFinite(number) ? number : undefined;
    } else {
      numValues[n] = undefined;
    }
  }

  return {
    ...field,
    type: FieldType.number,
    values: new ArrayVector(numValues),
  };
}

function fieldToBooleanField(field: Field): Field {
  const booleanValues = field.values.toArray().slice();

  for (let b = 0; b < booleanValues.length; b++) {
    booleanValues[b] = Boolean(booleanValues[b]);
  }

  return {
    ...field,
    type: FieldType.boolean,
    values: new ArrayVector(booleanValues),
  };
}

function fieldToStringField(field: Field): Field {
  const stringValues = field.values.toArray().slice();

  for (let s = 0; s < stringValues.length; s++) {
    stringValues[s] = `${stringValues[s]}`;
  }

  return {
    ...field,
    type: FieldType.string,
    values: new ArrayVector(stringValues),
  };
}

/**
 * @alpha
 */
export function ensureTimeField(field: Field, dateFormat?: string): Field {
  if (field.type === FieldType.time && field.values.length && typeof field.values.get(0) === 'number') {
    return field; //already time
  }
  if (field.values.length && typeof field.values.get(0) === 'number') {
    return {
      ...field,
      type: FieldType.time,
    };
  }
  return fieldToTimeField(field, dateFormat);
}
