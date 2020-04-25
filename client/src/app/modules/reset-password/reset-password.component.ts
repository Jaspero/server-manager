import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {from} from 'rxjs';
import {tap} from 'rxjs/operators';
import {STATIC_CONFIG} from '../../../environments/static-config';
import {notify} from '../../shared/utils/notify.operator';
import {RepeatPasswordValidator} from '../../shared/validators/repeat-password.validator';

@Component({
  selector: 'jms-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private afAuth: AngularFireAuth,
    private activatedRoute: ActivatedRoute,
    private transloco: TranslocoService
  ) { }

  form: FormGroup;
  staticConfig = STATIC_CONFIG;
  code: string;

  ngOnInit() {

    this.code = this.activatedRoute.snapshot.queryParams.oobCode;

    this.form = this.fb.group(
      {
        password: ['', Validators.required],
        repeatPassword: ['', Validators.required]
      },
      {
        validator: RepeatPasswordValidator('Passwords not matching')
      }
    );
  }

  reset() {
    return () =>
      from(
        this.afAuth.auth.confirmPasswordReset(
          this.code,
          this.form.get('password').value
        )
      )
        .pipe(
          notify({
            success: this.transloco.translate('RESET_PASSWORD.RESET_SUCCESSFUL')
          }),
          tap(() =>
            this.router.navigate(['/login'])
          )
        )
  }
}
