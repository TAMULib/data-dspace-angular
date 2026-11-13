import { DOCUMENT, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit } from '@angular/core';

@Component({
  selector: 'dc-relation-associated-publication-uri',
  standalone: true,
  imports: [NgIf],
  styleUrls: ['./dc-relation-associatedPublicationURI.scss'],
  templateUrl: './dc-relation-associatedPublicationURI.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChildComponent implements OnInit {
  private document = inject(DOCUMENT);

  value = input<string>();

  isLink: boolean = false;
  valueText: string = '';
  valueHref: string | null = null;
  valueTarget: string = '';
  valueRel: string = '';

  ngOnInit() {
    const template = this.document.createElement('template');
    template.innerHTML = this.value() ?? '';
    const anchor = template.content.querySelector('a');

    if (anchor) {
      this.isLink = true;
      this.valueHref = anchor.getAttribute('href');
      this.valueText = anchor.textContent || this.valueHref || '';

      if (anchor.hasAttribute('target')) {
        this.valueTarget = anchor.getAttribute('target') ?? '';
      }

      if (anchor.hasAttribute('rel')) {
        this.valueRel = anchor.getAttribute('rel') ?? '';
      }
    } else {
      this.valueText = template.content.textContent || '';
    }
  }
}
