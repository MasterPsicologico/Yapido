using UnityEngine;
using UnityEngine.UI;
using NarutoClash.Core;
using NarutoClash.Audio;

namespace NarutoClash.Bootstrap
{
    /// <summary>
    /// Script helper para auto-armar la escena. Arrastra a un GameObject
    /// vacío y asigna las refs. En Start, inicializa todo lo que falte.
    /// Útil para prototipar rápido sin tener que enlazar 50 referencias.
    /// </summary>
    public class SceneBootstrap : MonoBehaviour
    {
        [Header("Prefab references (assign in Inspector)")]
        public GameObject player1Prefab;
        public GameObject player2Prefab;
        public Transform[] spawnPoints;

        [Header("UI")]
        public Canvas canvas;
        public GameObject joystickPrefab;
        public GameObject buttonPrefab;
        public GameObject healthBarPrefab;
        public GameObject chakraBarPrefab;
        public GameObject substitutionBarPrefab;
        public Text timerText;
        public Text p1WinsText;
        public Text p2WinsText;

        [Header("System singletons (auto-created if null)")]
        public VFX.VFXManager vfxManager;
        public AudioManager audioManager;
        public GameManager gameManager;
        public TimeManager timeManager;
        public ObjectPool objectPool;
        public Input.MobileInputManager inputManager;

        private void Awake()
        {
            EnsureSystem("VFXManager", vfxManager);
            EnsureSystem("AudioManager", audioManager);
            EnsureSystem("GameManager", gameManager);
            EnsureSystem("TimeManager", timeManager);
            EnsureSystem("ObjectPool", objectPool);
            EnsureSystem("InputManager", inputManager);
        }

        private void Start()
        {
            if (player1Prefab == null || player2Prefab == null)
            {
                Debug.LogError("[SceneBootstrap] Faltan prefabs de fighters. Asigna player1Prefab y player2Prefab en el Inspector.");
                return;
            }

            var p1 = Instantiate(player1Prefab, spawnPoints[0].position, Quaternion.identity).GetComponent<Player.FighterController>();
            var p2 = Instantiate(player2Prefab, spawnPoints[1].position, Quaternion.identity).GetComponent<Player.FighterController>();

            p1.opponent = p2;
            p2.opponent = p1;
            p2.IsAI = true;

            if (inputManager != null)
            {
                inputManager.player1 = p1;
                inputManager.player2 = p2;
            }

            var battle = FindAnyObjectByType<BattleManager>();
            if (battle != null)
            {
                battle.player1 = p1;
                battle.player2 = p2;
                battle.player2IsAI = true;
                battle.BeginRound();
            }

            if (GameManager.Instance != null) GameManager.Instance.StartMatch();
        }

        private void EnsureSystem(string name, Component c)
        {
            if (c != null) return;
            var go = new GameObject(name);
            go.transform.SetParent(transform);
            switch (name)
            {
                case "VFXManager": go.AddComponent<VFX.VFXManager>(); break;
                case "AudioManager": go.AddComponent<AudioManager>(); break;
                case "GameManager": go.AddComponent<GameManager>(); break;
                case "TimeManager": go.AddComponent<TimeManager>(); break;
                case "ObjectPool": go.AddComponent<ObjectPool>(); break;
                case "InputManager": go.AddComponent<Input.MobileInputManager>(); break;
            }
        }
    }
}
