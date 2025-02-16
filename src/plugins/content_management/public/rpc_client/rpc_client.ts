/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { HttpSetup } from '@kbn/core/public';
import { API_ENDPOINT } from '../../common';
import type {
  GetIn,
  BulkGetIn,
  CreateIn,
  UpdateIn,
  DeleteIn,
  SearchIn,
  ProcedureName,
} from '../../common';
import type { CrudClient } from '../crud_client/crud_client';
import type {
  GetResponse,
  BulkGetResponse,
  CreateItemResponse,
  DeleteItemResponse,
  UpdateItemResponse,
  SearchResponse,
} from '../../server/core/crud';

export class RpcClient implements CrudClient {
  constructor(private http: { post: HttpSetup['post'] }) {}

  public get<I extends GetIn = GetIn, O = unknown, M = unknown>(input: I) {
    return this.sendMessage<GetResponse<O, M>>('get', input).then((r) => r.item);
  }

  public bulkGet<I extends BulkGetIn = BulkGetIn, O = unknown, M = unknown>(input: I) {
    return this.sendMessage<BulkGetResponse<O, M>>('bulkGet', input).then((r) => r.items);
  }

  public create<I extends CreateIn = CreateIn, O = unknown, M = unknown>(input: I) {
    return this.sendMessage<CreateItemResponse<O, M>>('create', input).then((r) => r.result);
  }

  public update<I extends UpdateIn = UpdateIn, O = unknown, M = unknown>(input: I) {
    return this.sendMessage<UpdateItemResponse<O, M>>('update', input).then((r) => r.result);
  }

  public delete<I extends DeleteIn = DeleteIn>(input: I) {
    return this.sendMessage<DeleteItemResponse>('delete', input).then((r) => r.result);
  }

  public search<I extends SearchIn = SearchIn, O = unknown>(input: I) {
    return this.sendMessage<SearchResponse<O>>('search', input).then((r) => r.result);
  }

  private sendMessage = async <O = unknown>(name: ProcedureName, input: any): Promise<O> => {
    const { result } = await this.http.post<{ result: O }>(`${API_ENDPOINT}/${name}`, {
      body: JSON.stringify(input),
    });
    return result;
  };
}
