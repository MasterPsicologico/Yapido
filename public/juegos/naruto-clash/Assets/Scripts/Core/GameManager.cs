using UnityEngine;
using UnityEngine.SceneManagement;

namespace NarutoClash.Core
{
    /// <summary>
    /// Singleton global. Gestiona estado de juego (menú, round, KO, victoria),
    /// pausa, y transiciones de escena.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public enum GameState { Boot, Menu, Intro, Round, RoundEnd, MatchEnd, Pause }

        [Header("State")]
        public GameState state = GameState.Boot;
        public int p1Wins = 0;
        public int p2Wins = 0;
        public int winsToVictory = 2;
        public float roundTimer = 99f;
        public float currentTime = 99f;

        [Header("Refs")]
        public BattleManager battle;
        public Audio.AudioManager audio;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            Application.targetFrameRate = 60;
            QualitySettings.vSyncCount = 0;
        }

        private void Update()
        {
            if (state == GameState.Round)
            {
                currentTime -= Time.deltaTime;
                if (currentTime <= 0)
                {
                    currentTime = 0;
                    OnTimeOut();
                }
            }
        }

        public void StartMatch()
        {
            p1Wins = 0;
            p2Wins = 0;
            StartNextRound();
        }

        public void StartNextRound()
        {
            currentTime = roundTimer;
            state = GameState.Intro;
            if (battle != null) battle.BeginRound();
            state = GameState.Round;
        }

        public void OnFighterKO(Player.FighterController f)
        {
            if (state != GameState.Round) return;
            if (battle == null) return;
            if (f == battle.player1) p2Wins++;
            else if (f == battle.player2) p1Wins++;

            if (p1Wins >= winsToVictory || p2Wins >= winsToVictory)
            {
                state = GameState.MatchEnd;
            }
            else
            {
                state = GameState.RoundEnd;
                Invoke(nameof(StartNextRound), 3f);
            }
        }

        public void OnTimeOut()
        {
            if (battle == null) return;
            if (battle.player1.currentHealth > battle.player2.currentHealth) p1Wins++;
            else if (battle.player2.currentHealth > battle.player1.currentHealth) p2Wins++;
            state = GameState.RoundEnd;
            Invoke(nameof(StartNextRound), 3f);
        }

        public void TogglePause()
        {
            if (state == GameState.Round) { state = GameState.Pause; Time.timeScale = 0f; }
            else if (state == GameState.Pause) { state = GameState.Round; Time.timeScale = 1f; }
        }
    }
}
