import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameBackgroundComponent } from './game-background/game-background';
import { GameButtonComponent } from './game-button/game-button';
import { GameCardComponent } from './game-card/game-card';

@Component({
  imports: [GameBackgroundComponent, GameCardComponent, GameButtonComponent],
  template: `
    <app-game-background>
      <app-game-card>
        <div class="stack">
          <h2 class="game-heading">AI Knowledge Challenge</h2>
          <p class="game-body">
            Shared atmosphere, cards, and actions stay inside the frame.
            Pneumonoultramicroscopicsilicovolcanoconiosis
          </p>
          <app-game-button variant="primary">Primary action for the match</app-game-button>
          <app-game-button variant="secondary" [disabled]="true">Secondary action</app-game-button>
        </div>
      </app-game-card>
    </app-game-background>
  `,
  styles: `
    :host {
      display: block;
    }

    .stack {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 0.5rem;
      min-width: 0;
    }
  `,
})
class GameUiHarnessComponent {}

describe('Game UI foundation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    document.documentElement.style.width = '';
    document.body.style.width = '';
  });

  it('renders the shared components without game services', () => {
    const background = TestBed.createComponent(GameBackgroundComponent);
    const card = TestBed.createComponent(GameCardComponent);
    const button = TestBed.createComponent(GameButtonComponent);

    background.detectChanges();
    card.detectChanges();
    button.detectChanges();

    expect(background.nativeElement.querySelector('.wash')).not.toBeNull();
    expect(background.nativeElement.querySelector('.orb-one')).not.toBeNull();
    expect(card.nativeElement.querySelector('.card')).not.toBeNull();
    expect(button.nativeElement.querySelector('button.is-primary')?.getAttribute('type')).toBe(
      'button',
    );

    background.destroy();
    card.destroy();
    button.destroy();
  });

  it('supports primary, secondary, and disabled button states', () => {
    const fixture = TestBed.createComponent(GameButtonComponent);
    fixture.detectChanges();

    const enabled = buttonElement(fixture);
    expect(enabled.classList.contains('is-primary')).toBeTrue();
    expect(enabled.disabled).toBeFalse();

    const heard: Event[] = [];
    enabled.addEventListener('click', (event) => heard.push(event));
    enabled.click();
    expect(heard.length).toBe(1);

    fixture.componentRef.setInput('variant', 'secondary');
    fixture.componentRef.setInput('disabled', true);
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();

    const disabled = buttonElement(fixture);
    expect(disabled.classList.contains('is-secondary')).toBeTrue();
    expect(disabled.disabled).toBeTrue();
    expect(disabled.getAttribute('type')).toBe('submit');

    const blocked: Event[] = [];
    disabled.addEventListener('click', (event) => blocked.push(event));
    disabled.click();
    expect(blocked).toEqual([]);

    fixture.destroy();
  });

  it('gives the card a border, shadow, and width-based padding', () => {
    for (const width of [390, 768, 1280]) {
      document.documentElement.style.width = '1440px';
      document.body.style.width = '1440px';

      const fixture = TestBed.createComponent(GameCardComponent);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = `${width}px`;
      fixture.detectChanges();

      const card = host.querySelector('.card') as HTMLElement;
      const style = getComputedStyle(card);
      expect(style.borderTopWidth).not.toBe('0px');
      expect(style.boxShadow).not.toBe('none');
      expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

      const padding = parseFloat(style.paddingTop);
      if (width >= 1280) {
        expect(padding).toBeCloseTo(24, 0);
      } else if (width >= 768) {
        expect(padding).toBeCloseTo(16, 0);
      } else {
        expect(padding).toBeCloseTo(8, 0);
      }

      fixture.destroy();
    }
  });

  it('does not overflow horizontally at 390px, 768px, and 1280px', () => {
    for (const width of [390, 768, 1280]) {
      document.documentElement.style.width = `${width}px`;
      document.body.style.width = `${width}px`;

      const fixture = TestBed.createComponent(GameUiHarnessComponent);
      const host = fixture.nativeElement as HTMLElement;
      host.style.width = '100%';
      fixture.detectChanges();

      expect(horizontalOverflow(host)).withContext(`${width}px`).toEqual([]);
      fixture.destroy();
    }
  });
});

function buttonElement(fixture: ComponentFixture<GameButtonComponent>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
}

function horizontalOverflow(root: HTMLElement): string[] {
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  return nodes
    .filter((node) => node.scrollWidth > node.clientWidth + 1)
    .map((node) => `${node.tagName}.${node.className}: ${node.scrollWidth}>${node.clientWidth}`);
}
