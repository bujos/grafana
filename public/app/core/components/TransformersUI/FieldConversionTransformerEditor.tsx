import React, { useCallback } from 'react';
import {
  DataTransformerID,
  FieldType,
  SelectableValue,
  standardTransformers,
  TransformerRegistryItem,
  TransformerUIProps,
} from '@grafana/data';

import {
  FieldConversionTransformerOptions,
  fieldConversionFieldInfo,
} from '@grafana/data/src/transformations/transformers/fieldConversion';
import { InlineField, InlineFieldRow, Select } from '@grafana/ui';
import { useAllFieldNamesFromDataFrames } from './utils';

export const FieldConversionTransformerEditor: React.FC<TransformerUIProps<FieldConversionTransformerOptions>> = ({
  input,
  options,
  onChange,
}) => {
  const fieldNames = useAllFieldNamesFromDataFrames(input);
  const selectableFieldNames = fieldNames.map((f) => ({ label: f, value: f }));

  //potentially replace with matchers?
  const allTypes: Array<SelectableValue<FieldType>> = [
    { value: FieldType.number, label: 'Numeric' },
    { value: FieldType.string, label: 'String' },
    { value: FieldType.time, label: 'Time' },
    { value: FieldType.boolean, label: 'Boolean' },
    { value: FieldType.trace, label: 'Traces' },
    { value: FieldType.other, label: 'Other' },
  ];

  //verify is there is not already accepted dateFormats list
  const dateFormats: Array<SelectableValue<string>> = [
    { label: 'YYYY-MM-DD HH:mm:ss', f: 'YYYY-MM-DD HH:mm:ss' },
    { label: 'MM/DD/YYYY h:mm:ss a', f: 'MM/DD/YYYY h:mm:ss a' },
  ];

  const onSelectField = useCallback(
    (value: SelectableValue<string>) => {
      onChange({
        ...options,
        targetField: value.value,
      });
    },
    [onChange, options]
  );

  const onSelectDestinationType = useCallback(
    (value: SelectableValue<FieldType>) => {
      onChange({
        ...options,
        destinationType: value.value,
      });
    },
    [onChange, options]
  );

  const onSelectFormat = useCallback(
    (value: SelectableValue<string>) => {
      onChange({
        ...options,
        dateFormat: value.value,
      });
    },
    [onChange, options]
  );

  //TODO
  //handle multiple field conversions
  //refactor to FieldNamePicker + fieldMatcher(?)
  //show units for fields

  return (
    <div>
      <InlineFieldRow>
        <InlineField label={fieldConversionFieldInfo.targetField.label} grow={true}>
          <Select
            menuShouldPortal
            options={selectableFieldNames}
            value={options.targetField}
            placeholder={fieldConversionFieldInfo.targetField.description}
            onChange={onSelectField}
          />
        </InlineField>
      </InlineFieldRow>
      <InlineFieldRow>
        <InlineField label={fieldConversionFieldInfo.destinationType.label} grow={true}>
          <Select
            menuShouldPortal
            options={allTypes}
            value={options.destinationType}
            placeholder={fieldConversionFieldInfo.destinationType.description}
            onChange={onSelectDestinationType}
          />
        </InlineField>
        {options.destinationType === FieldType.time && (
          <InlineField label={fieldConversionFieldInfo.dateFormat.label} grow={true}>
            <Select
              menuShouldPortal
              options={dateFormats}
              value={options.dateFormat}
              placeholder={fieldConversionFieldInfo.dateFormat.description}
              onChange={onSelectFormat}
            />
          </InlineField>
        )}
      </InlineFieldRow>
    </div>
  );
};

export const fieldConversionTransformRegistryItem: TransformerRegistryItem<FieldConversionTransformerOptions> = {
  id: DataTransformerID.fieldConversion,
  editor: FieldConversionTransformerEditor,
  transformation: standardTransformers.fieldConversionTransformer,
  name: standardTransformers.fieldConversionTransformer.name,
  description: standardTransformers.fieldConversionTransformer.description,
};
