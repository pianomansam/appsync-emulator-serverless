const {
  log,
  sendErr,
  installStdIOHandlers,
  installExceptionHandlers,
} = require('./lambda/util');

process.once(
  'message',
  async ({ serverlessDirectory, handlerMethod, payload }) => {
    try {
      log.info('load', handlerMethod);

      const { spawn } = require('child_process');
      const args = ['invoke', 'local', '-f', handlerMethod];

      const sls = spawn('sls', args, {
        env: process.env,
        shell: '/bin/bash',
        cwd: serverlessDirectory,
      });

      installStdIOHandlers('python', sls, payload);
    } catch (err) {
      sendErr(err);
    }
  },
);

installExceptionHandlers();
