import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { AudioService } from '../../services/audio.service';
import { TimerComponent } from './timer';

describe('TimerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
    spyOn(TestBed.inject(AudioService), 'playWarningSound');
  });

  it('counts down from the given duration, warns in the last five seconds, and times out once', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerComponent);
    const timeouts: number[] = [];
    fixture.componentInstance.timedOut.subscribe(() =>
      timeouts.push(fixture.componentInstance.secondsLeft()),
    );
    fixture.componentRef.setInput('durationSeconds', 10);
    fixture.detectChanges();

    const timer = fixture.nativeElement.querySelector('.timer') as HTMLElement;
    expect(timer.textContent).toContain('10s');
    expect(timer.classList.contains('urgent')).toBeFalse();

    tick(5000);
    fixture.detectChanges();
    expect(timer.textContent).toContain('5s');
    expect(timer.classList.contains('urgent')).toBeTrue();

    tick(5000);
    fixture.detectChanges();
    expect(timer.textContent).toContain('0s');
    expect(timer.classList.contains('timeout')).toBeTrue();
    expect(timeouts).toEqual([0]);

    tick(3000);
    expect(timeouts).toEqual([0]);

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('starts an Easy question at 20 seconds', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerComponent);
    fixture.componentRef.setInput('durationSeconds', 20);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('20s');
    tick(15000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('5s');
    expect(fixture.nativeElement.querySelector('.urgent')).not.toBeNull();

    fixture.destroy();
    discardPeriodicTasks();
  }));

  it('stops when an answer halts it and does not emit timeout', fakeAsync(() => {
    const fixture = TestBed.createComponent(TimerComponent);
    const timeouts: number[] = [];
    fixture.componentInstance.timedOut.subscribe(() => timeouts.push(1));
    fixture.componentRef.setInput('durationSeconds', 20);
    fixture.detectChanges();

    tick(4000);
    fixture.detectChanges();
    fixture.componentRef.setInput('halted', true);
    fixture.detectChanges();
    tick(30000);

    expect(timeouts).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('16s');

    fixture.destroy();
    discardPeriodicTasks();
  }));
});
