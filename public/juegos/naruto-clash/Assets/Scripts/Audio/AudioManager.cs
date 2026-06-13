using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Audio;

namespace NarutoClash.Audio
{
    /// <summary>
    /// AudioManager central. Usa AudioMixer para separar SFX/VOX/BGM/UI.
    /// Precachea clips para evitar I/O en mitad del combate.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [Header("Mixer")]
        public AudioMixer mixer;
        public AudioMixerGroup sfxGroup;
        public AudioMixerGroup voxGroup;
        public AudioMixerGroup bgmGroup;
        public AudioMixerGroup uiGroup;

        [Header("Pool")]
        public int sfxPoolSize = 16;
        public int voxPoolSize = 8;

        [Header("BGM")]
        public AudioClip[] bgmClips;
        public AudioSource bgmSource;

        private List<AudioSource> sfxPool = new List<AudioSource>();
        private List<AudioSource> voxPool = new List<AudioSource>();
        private Dictionary<string, AudioClip> sfxCache = new Dictionary<string, AudioClip>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            for (int i = 0; i < sfxPoolSize; i++) sfxPool.Add(CreateSource(sfxGroup, false));
            for (int i = 0; i < voxPoolSize; i++) voxPool.Add(CreateSource(voxGroup, false));
            if (bgmSource == null)
            {
                bgmSource = gameObject.AddComponent<AudioSource>();
                bgmSource.outputAudioMixerGroup = bgmGroup;
                bgmSource.loop = true;
                bgmSource.playOnAwake = false;
            }
        }

        private AudioSource CreateSource(AudioMixerGroup g, bool loop)
        {
            var s = gameObject.AddComponent<AudioSource>();
            s.outputAudioMixerGroup = g;
            s.playOnAwake = false;
            s.loop = loop;
            s.spatialBlend = 0f;
            return s;
        }

        public void PrecacheSFX(string[] names)
        {
            for (int i = 0; i < names.Length; i++)
            {
                var clip = Resources.Load<AudioClip>("SFX/" + names[i]);
                if (clip != null) sfxCache[names[i]] = clip;
            }
        }

        public static void PlaySFX(AudioClip clip, float volume = 1f)
        {
            if (Instance == null || clip == null) return;
            var src = Instance.GetFreeSource(Instance.sfxPool);
            if (src == null) return;
            src.PlayOneShot(clip, volume);
        }

        public static void PlayVOX(AudioClip clip, float volume = 1f)
        {
            if (Instance == null || clip == null) return;
            var src = Instance.GetFreeSource(Instance.voxPool);
            if (src == null) return;
            src.PlayOneShot(clip, volume);
        }

        public void PlayBGM(int index)
        {
            if (bgmClips == null || index < 0 || index >= bgmClips.Length) return;
            bgmSource.clip = bgmClips[index];
            bgmSource.Play();
        }

        public void StopBGM() { if (bgmSource != null) bgmSource.Stop(); }

        public void SetSFXVolume(float v)
        {
            if (mixer != null) mixer.SetFloat("SFXVolume", Mathf.Log10(Mathf.Max(0.001f, v)) * 20);
        }

        public void SetBGMVolume(float v)
        {
            if (mixer != null) mixer.SetFloat("BGMVolume", Mathf.Log10(Mathf.Max(0.001f, v)) * 20);
        }

        private AudioSource GetFreeSource(List<AudioSource> pool)
        {
            for (int i = 0; i < pool.Count; i++)
            {
                if (pool[i] != null && !pool[i].isPlaying) return pool[i];
            }
            var s = CreateSource(pool == sfxPool ? sfxGroup : voxGroup, false);
            pool.Add(s);
            return s;
        }
    }
}
