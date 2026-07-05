/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*?worker' {
  const WorkerConstructor: {
    new (): Worker;
  };
  export default WorkerConstructor;
}

declare module '*?worker&inline' {
  const WorkerConstructor: {
    new (): Worker;
  };
  export default WorkerConstructor;
}
