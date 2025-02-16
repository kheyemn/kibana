/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  IngestPipeline,
  IngestRemoveProcessor,
  IngestSetProcessor,
  MlTrainedModelConfig,
  MlTrainedModelStats,
} from '@elastic/elasticsearch/lib/api/types';

import {
  SUPPORTED_PYTORCH_TASKS,
  TRAINED_MODEL_TYPE,
  BUILT_IN_MODEL_TAG,
} from '@kbn/ml-trained-models-utils';

import {
  MlInferencePipeline,
  CreateMlInferencePipelineParameters,
  TrainedModelState,
  InferencePipelineInferenceConfig,
} from '../types/pipelines';

export const TEXT_EXPANSION_TYPE = SUPPORTED_PYTORCH_TASKS.TEXT_EXPANSION;
export const TEXT_EXPANSION_FRIENDLY_TYPE = 'ELSER';

export interface MlInferencePipelineParams {
  description?: string;
  fieldMappings: Record<string, string | undefined>;
  inferenceConfig?: InferencePipelineInferenceConfig;
  model: MlTrainedModelConfig;
  pipelineName: string;
}

/**
 * Generates the pipeline body for a machine learning inference pipeline
 * @param pipelineConfiguration machine learning inference pipeline configuration parameters
 * @returns pipeline body
 */
export const generateMlInferencePipelineBody = ({
  description,
  fieldMappings,
  inferenceConfig,
  model,
  pipelineName,
}: MlInferencePipelineParams): MlInferencePipeline => {
  // if model returned no input field, insert a placeholder
  const modelInputField =
    model.input?.field_names?.length > 0 ? model.input.field_names[0] : 'MODEL_INPUT_FIELD';

  // For now this only works for a single field mapping
  const sourceField = Object.keys(fieldMappings)[0];
  const destinationField = fieldMappings[sourceField] ?? sourceField;
  const inferenceType = Object.keys(model.inference_config)[0];
  const remove = getRemoveProcessorForInferenceType(destinationField, inferenceType);
  const set = getSetProcessorForInferenceType(destinationField, inferenceType);

  return {
    description: description ?? '',
    processors: [
      {
        remove: {
          field: `ml.inference.${destinationField}`,
          ignore_missing: true,
        },
      },
      ...(remove ? [{ remove }] : []),
      {
        inference: {
          field_map: {
            [sourceField]: modelInputField,
          },
          inference_config: inferenceConfig,
          model_id: model.model_id,
          on_failure: [
            {
              append: {
                field: '_source._ingest.inference_errors',
                value: [
                  {
                    message: `Processor 'inference' in pipeline '${pipelineName}' failed with message '{{ _ingest.on_failure_message }}'`,
                    pipeline: pipelineName,
                    timestamp: '{{{ _ingest.timestamp }}}',
                  },
                ],
              },
            },
          ],
          target_field: `ml.inference.${destinationField}`,
        },
      },
      {
        append: {
          field: '_source._ingest.processors',
          value: [
            {
              model_version: model.version,
              pipeline: pipelineName,
              processed_timestamp: '{{{ _ingest.timestamp }}}',
              types: getMlModelTypesForModelConfig(model),
            },
          ],
        },
      },
      ...(set ? [{ set }] : []),
    ],
    version: 1,
  };
};

export const getSetProcessorForInferenceType = (
  destinationField: string,
  inferenceType: string
): IngestSetProcessor | undefined => {
  let set: IngestSetProcessor | undefined;
  const prefixedDestinationField = `ml.inference.${destinationField}`;

  if (inferenceType === SUPPORTED_PYTORCH_TASKS.TEXT_CLASSIFICATION) {
    set = {
      copy_from: `${prefixedDestinationField}.predicted_value`,
      description: `Copy the predicted_value to '${destinationField}' if the prediction_probability is greater than 0.5`,
      field: destinationField,
      if: `ctx?.ml?.inference != null && ctx.ml.inference['${destinationField}'] != null && ctx.ml.inference['${destinationField}'].prediction_probability > 0.5`,
      value: undefined,
    };
  } else if (inferenceType === SUPPORTED_PYTORCH_TASKS.TEXT_EMBEDDING) {
    set = {
      copy_from: `${prefixedDestinationField}.predicted_value`,
      description: `Copy the predicted_value to '${destinationField}'`,
      field: destinationField,
      if: `ctx?.ml?.inference != null && ctx.ml.inference['${destinationField}'] != null`,
      value: undefined,
    };
  }

  return set;
};

export const getRemoveProcessorForInferenceType = (
  destinationField: string,
  inferenceType: string
): IngestRemoveProcessor | undefined => {
  if (
    inferenceType === SUPPORTED_PYTORCH_TASKS.TEXT_CLASSIFICATION ||
    inferenceType === SUPPORTED_PYTORCH_TASKS.TEXT_EMBEDDING
  ) {
    return {
      field: destinationField,
      ignore_missing: true,
    };
  }
};

/**
 * Parses model types list from the given configuration of a trained machine learning model
 * @param trainedModel configuration for a trained machine learning model
 * @returns list of model types
 */
export const getMlModelTypesForModelConfig = (trainedModel: MlTrainedModelConfig): string[] => {
  if (!trainedModel) return [];

  const isBuiltIn = trainedModel.tags?.includes(BUILT_IN_MODEL_TAG);

  return [
    trainedModel.model_type,
    ...Object.keys(trainedModel.inference_config || {}),
    ...(isBuiltIn ? [BUILT_IN_MODEL_TAG] : []),
  ].filter((type): type is string => type !== undefined);
};

export const formatPipelineName = (rawName: string) =>
  rawName
    .trim()
    .replace(/\s+/g, '_') // Convert whitespaces to underscores
    .toLowerCase();

export const parseMlInferenceParametersFromPipeline = (
  name: string,
  pipeline: IngestPipeline
): CreateMlInferencePipelineParameters | null => {
  const processor = pipeline?.processors?.find((proc) => proc.inference !== undefined);
  if (!processor || processor?.inference === undefined) {
    return null;
  }
  const { inference: inferenceProcessor } = processor;
  const sourceFields = Object.keys(inferenceProcessor.field_map ?? {});
  const sourceField = sourceFields.length === 1 ? sourceFields[0] : null;
  if (!sourceField) {
    return null;
  }
  return {
    destination_field: inferenceProcessor.target_field?.replace('ml.inference.', ''),
    model_id: inferenceProcessor.model_id,
    pipeline_name: name,
    source_field: sourceField,
  };
};

export const parseModelStateFromStats = (
  model?: Partial<MlTrainedModelStats> & Partial<MlTrainedModelConfig>,
  modelTypes?: string[]
) => {
  if (
    model?.model_type === TRAINED_MODEL_TYPE.LANG_IDENT ||
    modelTypes?.includes(TRAINED_MODEL_TYPE.LANG_IDENT)
  )
    return TrainedModelState.Started;
  switch (model?.deployment_stats?.state) {
    case 'started':
      return TrainedModelState.Started;
    case 'starting':
      return TrainedModelState.Starting;
    case 'stopping':
      return TrainedModelState.Stopping;
    // @ts-ignore: type is wrong, "failed" is a possible state
    case 'failed':
      return TrainedModelState.Failed;
    default:
      return TrainedModelState.NotDeployed;
  }
};

export const parseModelStateReasonFromStats = (trainedModelStats?: Partial<MlTrainedModelStats>) =>
  trainedModelStats?.deployment_stats?.reason;
