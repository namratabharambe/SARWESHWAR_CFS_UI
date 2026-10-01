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
  public readonly journey = input<ContainerJourneyData | null>({
    containerNo: 'FCIU3627463',
    steps: [
      { id: 'booking', title: 'Booking', timestamp: '24 Apr 10:20', status: 'Completed', iconType: 'booking' },
      { id: 'arrived', title: 'Arrived at Gate', timestamp: '24 Apr 14:35', status: 'Completed', iconType: 'arrived' },
      { id: 'ocr', title: 'OCR Verified', timestamp: '24 Apr 14:42', status: 'Completed', iconType: 'ocr' },
      { id: 'gate-in', title: 'Gate In', timestamp: '24 Apr 15:10', status: 'Completed', iconType: 'gate-in' },
      { id: 'yard', title: 'Yard Location', timestamp: '24 Apr 15:45', status: 'In Yard', iconType: 'yard' },
      { id: 'inspection', title: 'Inspection', timestamp: '24 Apr 16:10', status: 'Pending', iconType: 'inspection' },
      { id: 'gate-out', title: 'Gate Out', status: 'In Progress', iconType: 'gate-out' },
    ],
  });
}
