# Yoga frontend

This frontend is built with Angular 19.

## Setup and development

Install the locked dependencies from this directory:

```sh
npm ci
npm start
```

Create a production build with `npm run build`.

## Unit and integration tests

Run Jest with `npm test -- --runInBand`. For the coverage-enforced run, use:

```sh
npm run test:coverage
```

Jest enforces at least 80% statements, branches, functions, and lines. Its
report is written to `coverage/jest`. Coverage includes the application
services, guards, interceptor, routes, and components. Type-only model
interfaces and the static Material module barrel are excluded because they
contain no independently executable application behavior; CLI bootstrap and
polyfills are outside `src/app`.

## End-to-end tests

Run Cypress with `npm run cypress:run` or `npm run e2e:ci`. After an E2E run,
generate and check the NYC report with `npm run e2e:coverage`.
