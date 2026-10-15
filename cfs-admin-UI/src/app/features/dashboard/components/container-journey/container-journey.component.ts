import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface JourneyStep {
  id: string;
  title: string;
  timestamp?: string;
  status: 'Completed' | 'In Yard' | 'Pending' | 'In Progress';
  iconType: 'booking' | 'arrived' | 'ocr' | 'gate-in' | 'yard' | 'inspection' | 'gate-out';
}

export interface ContainerJourneyData {
  containerNo?: string;
  steps: JourneyStep[];
}

@Component({
  selector: 'app-container-journey',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './container-journey.component.html',
  styleUrls: ['./container-journey.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerJourneyComponent {
  public readonly journey = input<ContainerJourneyData | null>(null);
}
