import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PerformanceGroup, PerformanceReport } from '../../models/performance-report.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-performance-dashboard',
  imports: [],
  templateUrl: './performance-dashboard.html',
  styleUrl: './performance-dashboard.scss',
})
export class PerformanceDashboardComponent {
  readonly report = input.required<PerformanceReport>();

  formatResponseTime(milliseconds: number): string {
    return `${(milliseconds / 1000).toFixed(1)} s`;
  }

  groupValueText(group: PerformanceGroup): string {
    if (group.total === 0) {
      return 'Not attempted';
    }

    return `${group.correct} of ${group.total}, ${group.accuracy}%`;
  }
}
