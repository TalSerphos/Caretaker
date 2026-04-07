import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#2a2320');

    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 20, 'Caretaker', {
        color: '#f2dfc5',
        fontSize: '40px',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 24, 'M0 Bootstrap ready', {
        color: '#b8c49c',
        fontSize: '18px',
        fontFamily: 'sans-serif',
      })
      .setOrigin(0.5);
  }
}
