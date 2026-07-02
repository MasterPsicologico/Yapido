declare module 'animejs' {
  interface AnimeParams {
    targets?: any;
    delay?: any;
    duration?: any;
    easing?: any;
    direction?: 'normal' | 'reverse' | 'alternate';
    loop?: boolean | number;
    autoplay?: boolean;
    begin?: (anim: AnimeInstance) => void;
    update?: (anim: AnimeInstance) => void;
    complete?: (anim: AnimeInstance) => void;
    [key: string]: any;
  }

  interface AnimeInstance {
    play: () => void;
    pause: () => void;
    restart: () => void;
    reverse: () => void;
    seek: (time: number) => void;
    finished: Promise<void>;
    remove: (...selectors: any[]) => void;
  }

  interface AnimeStatic {
    (params: AnimeParams): AnimeInstance;
    set: (targets: any, props: any) => void;
    random: (min: any, max: any) => any;
    stagger: (val: any, params?: any) => any;
    remove: (targets: any, selectors?: string) => void;
  }

  const anime: AnimeStatic;
  export default anime;
  export { anime, AnimeParams, AnimeInstance, AnimeStatic };
}
