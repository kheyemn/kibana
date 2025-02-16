/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFieldNumber, EuiFlexGrid, EuiFlexItem, EuiFormLabel } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { Controller, useFormContext } from 'react-hook-form';
import type { CreateSLOInput } from '@kbn/slo-schema';

export function SloEditFormObjectiveSectionTimeslices() {
  const { control } = useFormContext<CreateSLOInput>();
  return (
    <EuiFlexGrid columns={3}>
      <EuiFlexItem>
        <EuiFormLabel>
          {i18n.translate('xpack.observability.slo.sloEdit.timeSliceTarget.label', {
            defaultMessage: 'Timeslice target (%)',
          })}
        </EuiFormLabel>
        <Controller
          shouldUnregister={true}
          name="objective.timesliceTarget"
          control={control}
          defaultValue={95}
          rules={{
            required: true,
            min: 0.001,
            max: 99.999,
          }}
          render={({ field: { ref, ...field }, fieldState }) => (
            <EuiFieldNumber
              {...field}
              required
              isInvalid={fieldState.invalid}
              value={String(field.value)}
              data-test-subj="sloFormObjectiveTimesliceTargetInput"
              min={0.001}
              max={99.999}
              step={0.001}
              onChange={(event) => field.onChange(Number(event.target.value))}
            />
          )}
        />
      </EuiFlexItem>

      <EuiFlexItem>
        <EuiFormLabel>
          {i18n.translate('xpack.observability.slo.sloEdit.timesliceWindow.label', {
            defaultMessage: 'Timeslice window (minutes)',
          })}
        </EuiFormLabel>

        <Controller
          shouldUnregister={true}
          name="objective.timesliceWindow"
          defaultValue="1"
          control={control}
          rules={{ required: true, min: 1, max: 120 }}
          render={({ field: { ref, ...field }, fieldState }) => (
            <EuiFieldNumber
              {...field}
              isInvalid={fieldState.invalid}
              required
              data-test-subj="sloFormObjectiveTimesliceWindowInput"
              value={String(field.value)}
              min={1}
              max={120}
              step={1}
              onChange={(event) => field.onChange(String(Number(event.target.value)))}
            />
          )}
        />
      </EuiFlexItem>
    </EuiFlexGrid>
  );
}
