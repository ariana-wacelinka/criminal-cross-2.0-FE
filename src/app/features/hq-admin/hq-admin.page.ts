import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hq-admin-page',
  templateUrl: './hq-admin.page.html',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HqAdminPage {}
