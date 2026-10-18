import registerCodeCoverageTasks from '@cypress/code-coverage/task';

export default (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) => {
  registerCodeCoverageTasks(on, config);
  return config;
};
