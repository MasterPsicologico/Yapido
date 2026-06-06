/// <reference types="vite/client" />

declare module 'animejs' {
  /**
   * Declaración mínima de Anime.js v3 para tipado en el motor.
   * Cubre los métodos que usamos en UIManager.
   */
  interface AnimeParams {
    targets: Element | Element[] | NodeListOf<Element> | string | object | object[];
    [key: string]: unknown;
  }

  interface AnimeInstance {
    play(): AnimeInstance;
    pause(): AnimeInstance;
    restart(): AnimeInstance;
    reverse(): AnimeInstance;
  }

  /** Helper para anime.stagger. */
  interface AnimeStagger {
    (value: number): (el: unknown, i: number, total: number) => number;
  }

  interface AnimeStatic {
    (params: AnimeParams): AnimeInstance;
    remove(targets: Element | Element[] | object): void;
    stagger: AnimeStagger;
  }

  const anime: AnimeStatic;
  export default anime;
}
