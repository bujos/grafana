import React, { useCallback } from 'react';
import {
  DataTransformerID,
  FieldNamePickerConfigSettings,
  FieldType,
  SelectableValue,
  StandardEditorsRegistryItem,
  standardTransformers,
  TransformerRegistryItem,
  TransformerUIProps,
} from '@grafana/data';

import { FieldConvertTypeTransformerOptions } from '@grafana/data/src/transformations/transformers/fieldConvertType';
import { Button, InlineField, InlineFieldRow, Input, Select } from '@grafana/ui';
import { FieldNamePicker } from '../../../../../packages/grafana-ui/src/components/MatchersUI/FieldNamePicker';

const fieldNamePickerSettings: StandardEditorsRegistryItem<string, FieldNamePickerConfigSettings> = {
  settings: { width: 24 },
} as any;

export const FieldConvertTypeTransformerEditor: React.FC<TransformerUIProps<FieldConvertTypeTransformerOptions>> = ({
  input,
  options,
  onChange,
}) => {
  const allTypes: Array<SelectableValue<FieldType>> = [
    { value: FieldType.number, label: 'Numeric' },
    { value: FieldType.string, label: 'String' },
    { value: FieldType.time, label: 'Time' },
    { value: FieldType.boolean, label: 'Boolean' },
  ];

  const onSelectField = useCallback(
    (idx) => (value: string) => {
      const conversions = options.conversions;
      conversions[idx] = { ...conversions[idx], targetField: value };
      onChange({
        ...options,
        conversions: conversions,
      });
    },
    [onChange, options]
  );

  const onSelectDestinationType = useCallback(
    (idx) => (value: SelectableValue<FieldType>) => {
      const conversions = options.conversions;
      conversions[idx] = { ...conversions[idx], destinationType: value.value };
      onChange({
        ...options,
        conversions: conversions,
      });
    },
    [onChange, options]
  );

  const onInputFormat = useCallback(
    (idx) => (value: SelectableValue<string>) => {
      const conversions = options.conversions;
      conversions[idx] = { ...conversions[idx], dateFormat: value.value };
      onChange({
        ...options,
        conversions: conversions,
      });
    },
    [onChange, options]
  );

  const onAddFieldConvertType = useCallback(() => {
    onChange({
      ...options,
      conversions: [
        ...options.conversions,
        { targetField: undefined, destinationType: undefined, dateFormat: undefined },
      ],
    });
  }, [onChange, options]);

  const onRemoveFieldConvertType = useCallback(
    (idx) => {
      const removed = options.conversions;
      removed.splice(idx, 1);
      onChange({
        ...options,
        conversions: removed,
      });
    },
    [onChange, options]
  );

  //TODO
  //show units for fields

  return (
    <>
      {options.conversions.map((c, idx) => {
        return (
          <InlineFieldRow key={`${c.targetField}-${idx}`}>
            <InlineField label={'Target field'}>
              <FieldNamePicker
                context={{ data: input }}
                value={c.targetField || ''}
                onChange={onSelectField(idx)}
                item={fieldNamePickerSettings}
              />
            </InlineField>
            <InlineField label={'Type to convert to'}>
              <Select
                menuShouldPortal
                options={allTypes}
                value={c.destinationType}
                placeholder={'Select the type'}
                onChange={onSelectDestinationType(idx)}
                width={18}
              />
            </InlineField>
            {c.destinationType === FieldType.time && (
              <InlineField label={'Date Format'}>
                <Input value={c.dateFormat} placeholder={'e.g. YYYY-MM-DD'} onChange={onInputFormat(idx)} width={24} />
              </InlineField>
            )}
            <Button size="md" icon="trash-alt" variant="secondary" onClick={() => onRemoveFieldConvertType(idx)} />
          </InlineFieldRow>
        );
      })}
      <Button
        size="sm"
        icon="plus"
        onClick={onAddFieldConvertType}
        variant="secondary"
        aria-label={'Add field conversion'}
      >
        {'Field conversion'}
      </Button>
    </>
  );
};

export const fieldConvertTypeTransformRegistryItem: TransformerRegistryItem<FieldConvertTypeTransformerOptions> = {
  id: DataTransformerID.fieldConvertType,
  editor: FieldConvertTypeTransformerEditor,
  transformation: standardTransformers.fieldConvertTypeTransformer,
  name: standardTransformers.fieldConvertTypeTransformer.name,
  description: standardTransformers.fieldConvertTypeTransformer.description,
};
