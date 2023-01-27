/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import type { ExceptionListItemSchema } from '@kbn/securitysolution-io-ts-list-types';
import { getExceptionListItemSchemaMock } from '@kbn/lists-plugin/common/schemas/response/exception_list_item_schema.mock';
import { TrustedAppGenerator } from '../../../../common/endpoint/data_generators/trusted_app_generator';
import type { TrustedApp } from '../../../../common/endpoint/types';

const getCommonItemDataOverrides = () => {
  return {
    name: 'some internal app',
    description: 'this app is trusted by the company',
    created_at: new Date('2021-07-01').toISOString(),
  };
};

export const getTrustedAppProviderMock = (): TrustedApp =>
  new TrustedAppGenerator('seed').generate(getCommonItemDataOverrides());

export const getExceptionProviderMock = (): ExceptionListItemSchema => {
  // Grab the properties from the generated Trusted App that should be the same across both types
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { name, description, created_at, updated_at, updated_by, created_by, id } =
    getTrustedAppProviderMock();

  // cloneDeep needed because exception mock generator uses state across instances
  return cloneDeep(
    getExceptionListItemSchemaMock({
      name,
      description,
      created_at,
      updated_at,
      updated_by,
      created_by,
      id,
      os_types: ['windows'],
      entries: [
        {
          field: 'process.hash.*',
          operator: 'included',
          type: 'match',
          value: '1234234659af249ddf3e40864e9fb241',
        },
        {
          field: 'process.executable.caseless',
          operator: 'included',
          type: 'match',
          value: 'c:\\fol\\bin.exe',
        },
      ],
      tags: ['policy:all'],
      comments: [
        {
          id: uuidv4(),
          comment: 'test',
          created_at: new Date().toISOString(),
          created_by: 'Justa',
        },
      ],
    })
  );
};
