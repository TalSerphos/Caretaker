import Phaser from 'phaser';
import { VerticalSliceScene } from '../scenes/VerticalSliceScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#1f1b1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 980, x: 0 },
      debug: false,
    },
  },
  scene: [VerticalSliceScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export const createGame = (): Phaser.Game => new Phaser.Game(gameConfig);
