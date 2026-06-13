using UnityEngine;
using NarutoClash.UI;

namespace NarutoClash.Core
{
    /// <summary>
    /// Orquesta el combate entre player1 y player2: refs, ronda, intro, KO, victoria.
    /// </summary>
    public class BattleManager : MonoBehaviour
    {
        public static BattleManager Instance { get; private set; }

        [Header("Fighters")]
        public Player.FighterController player1;
        public Player.FighterController player2;
        public bool player2IsAI = true;

        [Header("Stage")]
        public Transform stageCenter;
        public float stageWidth = 12f;
        public Transform[] spawnPoints;

        [Header("Camera")]
        public CameraController cameraController;

        [Header("UI")]
        public MobileHUD hud;

        [Header("Intro")]
        public float introDuration = 2.5f;
        public float introTimer = 0f;

        public enum RoundPhase { Waiting, Intro, Fighting, Ended }
        public RoundPhase phase = RoundPhase.Waiting;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            if (player1 != null) player1.opponent = player2;
            if (player2 != null) player2.opponent = player1;
            if (player2 != null) player2.IsAI = player2IsAI;
        }

        public void BeginRound()
        {
            phase = RoundPhase.Intro;
            introTimer = introDuration;
            if (player1 != null) player1.transform.position = spawnPoints[0].position;
            if (player2 != null) player2.transform.position = spawnPoints[1].position;
            if (player1 != null) player1.SetState(Player.FighterController.FighterState.Intros);
            if (player2 != null) player2.SetState(Player.FighterController.FighterState.Intros);
        }

        public void BeginFight()
        {
            phase = RoundPhase.Fighting;
            if (player1 != null) player1.SetState(Player.FighterController.FighterState.Idle);
            if (player2 != null) player2.SetState(Player.FighterController.FighterState.Idle);
        }

        public void OnFighterKO(Player.FighterController f)
        {
            phase = RoundPhase.Ended;
            if (GameManager.Instance != null) GameManager.Instance.OnFighterKO(f);
        }

        private void Update()
        {
            if (phase == RoundPhase.Intro)
            {
                introTimer -= Time.deltaTime;
                if (introTimer <= 0) BeginFight();
            }
        }
    }
}
