/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

const { resolve } = require('path');

/**
 * @param {{ rootDir: string; oss: boolean; examples: boolean; testPlugins?: boolean; }} options
 * @returns {string[]}
 */
function getPluginSearchPaths({ rootDir, oss, examples, testPlugins }) {
  return [
    resolve(rootDir, 'src', 'plugins'),
    ...(oss ? [] : [resolve(rootDir, 'x-pack', 'plugins')]),
    resolve(rootDir, 'plugins'),
    ...(examples ? [resolve(rootDir, 'examples')] : []),
    ...(examples && !oss ? [resolve(rootDir, 'x-pack', 'examples')] : []),
    resolve(rootDir, '..', 'kibana-extra'),
    ...(testPlugins
      ? [
          resolve(rootDir, 'test/analytics/plugins'),
          resolve(rootDir, 'test/health_gateway/plugins'),
          resolve(rootDir, 'test/plugin_functional/plugins'),
          resolve(rootDir, 'test/interpreter_functional/plugins'),
          resolve(rootDir, 'test/common/plugins'),
          resolve(rootDir, 'test/server_integration/plugins'),
        ]
      : []),
    ...(testPlugins && !oss
      ? [
          resolve(rootDir, 'x-pack/test/plugin_functional/plugins'),
          resolve(rootDir, 'x-pack/test/functional_with_es_ssl/plugins'),
          resolve(rootDir, 'x-pack/test/alerting_api_integration/plugins'),
          resolve(rootDir, 'x-pack/test/plugin_api_integration/plugins'),
          resolve(rootDir, 'x-pack/test/plugin_api_perf/plugins'),
          resolve(rootDir, 'x-pack/test/licensing_plugin/plugins'),
          resolve(rootDir, 'x-pack/test/usage_collection/plugins'),
          resolve(rootDir, 'x-pack/test/security_functional/plugins'),
        ]
      : []),
  ];
}

module.exports = { getPluginSearchPaths };
