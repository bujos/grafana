import { SynchronousDataTransformerInfo } from '../../types';
import { map } from 'rxjs/operators';

import { DataTransformerID } from './ids';
import { DataFrame, Field, FieldType } from '../../types/dataFrame';
import { dateTimeParse } from '../../datetime';
import { isFinite, isNumber } from 'lodash';
import { ArrayVector } from '../../vector';

export interface FieldConversionTransformerOptions {
  targetField: string | undefined;
  destinationType: FieldType | undefined;
  dateFormat?: string;
}

export interface FieldConversionOptions {
  targetField: string | undefined;
  destinationType: FieldType | undefined;
  dateFormat?: string;
}

/**
 * This is a helper class to use the same text in both a panel and transformer UI
 *
 * @internal
 */
export const fieldConversionFieldInfo = {
  targetField: {
    label: 'Target field',
    description: 'Select the target field',
  },
  destinationType: {
    label: 'Type to convert to',
    description: 'Select the type to convert',
  },
  dateFormat: {
    label: 'Date Format',
    description: 'Select the desired date format',
  },
};

/**
 * @alpha
 */
export const fieldConversionTransformer: SynchronousDataTransformerInfo<FieldConversionTransformerOptions> = {
  id: DataTransformerID.fieldConversion,
  name: 'Convert Fields',
  description: 'Convert a field to a specified field type',
  defaultOptions: {
    fields: {},
  },

  operator: (options) => (source) => source.pipe(map((data) => fieldConversionTransformer.transformer(options)(data))),

  transformer: (options: FieldConversionTransformerOptions) => (data: DataFrame[]) => {
    if (!Array.isArray(data) || data.length === 0) {
      return data;
    }
    const timeParsed = fieldConversion(options, data);
    if (!timeParsed) {
      return [];
    }
    return timeParsed;
  },
};

/**
 * @alpha
 */
export function fieldConversion(options: FieldConversionTransformerOptions, frames: DataFrame[]): DataFrame[] {
  if (!options.targetField) {
    return frames;
  }

  const frameCopy: DataFrame[] = [];
  let conversions = 0;

  for (const frame of frames) {
    for (let fieldIdx = 0; fieldIdx < frame.fields.length; fieldIdx++) {
      let field = frame.fields[fieldIdx];
      if (field.name === options.targetField) {
        //check in about matchers with Ryan
        if (options.destinationType === FieldType.time) {
          frame.fields[fieldIdx] = ensureTimeField(field, options.dateFormat);
        }
        conversions++;
        // if (conversions === options.conversions.length) {
        //   break;
        // }
      }
    }
    frameCopy.push(frame);
  }
  return frameCopy;
}

function stringToTimeField(field: Field, dateFormat?: string): Field {
  const timeValues = field.values.toArray().map((value) => {
    if (value) {
      let parsed;
      if (dateFormat) {
        parsed = dateTimeParse(value, { format: dateFormat });
      } else {
        parsed = dateTimeParse(value).valueOf();
      }
      return isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  });

  return {
    ...field,
    type: FieldType.time,
    values: new ArrayVector(timeValues),
  };
}

export function ensureTimeField(field: Field, dateFormat?: string): Field {
  //already time
  if ((field.type === FieldType.time && field.values.length) || isNumber(field.values.get(0))) {
    return field;
  }
  //TO DO
  //add more checks
  return stringToTimeField(field, dateFormat);
}
