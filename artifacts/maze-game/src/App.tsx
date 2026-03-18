import { GameScene } from "./game/GameScene";
import { StartScreen, GameOverScreen, LevelCompleteScreen, VictoryScreen, LeaderboardScreen, ShopScreen } from "./game/Screens";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#080a14" }}>
      <StartScreen />
      <LeaderboardScreen />
      <ShopScreen />
      <GameOverScreen />
      <LevelCompleteScreen />
      <VictoryScreen />
      <GameScene />
    </div>
  );
}

export default App;
