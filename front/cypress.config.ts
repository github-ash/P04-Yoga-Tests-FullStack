import { defineConfig } from 'cypress'
import registerCodeCoverageTasks from './cypress/plugins'

export default defineConfig({
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  fixturesFolder: 'cypress/fixtures',
  video: false,
  e2e: {
    setupNodeEvents: registerCodeCoverageTasks,
    baseUrl: 'http://localhost:4307',
  },
})
