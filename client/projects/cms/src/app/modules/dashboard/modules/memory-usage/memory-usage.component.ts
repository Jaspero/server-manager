import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {BehaviorSubject, bindCallback, Observable} from 'rxjs';
import {Database, onValue, ref} from '@angular/fire/database';
import {ActivatedRoute, Router} from "@angular/router";
import {filter, switchMap, tap} from "rxjs/operators";
import {UntilDestroy, untilDestroyed} from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
    selector: 'jms-memory-usage',
    templateUrl: './memory-usage.component.html',
    styleUrls: ['./memory-usage.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemoryUsageComponent implements OnInit {


    public ramUsed: Observable<any>[];

    mode$ = new BehaviorSubject<'task' | 'device'>(null);
    taskId$ = new BehaviorSubject<string>('');
    task$: Observable<any>;

    deviceId$ = new BehaviorSubject<string>('');

    constructor(
        private db: Database,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        // const memories: any = list(
        //     ref(db, '/devices')
        // )
        //     .pipe(
        //         map((snap) => {
        //             return snap.map((item) => {
        //
        //                 return item.snapshot.val();
        //             });
        //         })
        //     )
        //     .subscribe(console.log);
        // memories.valueChanges().subscribe(
        //     x => {
        //         this.ramUsed = x;
        //     }
        // );
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.pipe(
            tap((params) => {
                console.log(params);

                if (params.task) {
                    this.mode$.next('task');
                    this.taskId$.next(params.task);
                } else if (params.device) {
                    this.mode$.next('device');
                    this.deviceId$.next(params.device);
                } else {
                    this.router.navigate(['/']);
                    return;
                }

            }),
            untilDestroyed(this)
        ).subscribe();

        this.task$ = this.taskId$.pipe(
            filter(taskId => !!taskId),
            switchMap((taskId) => {

                // bindCallback(
                //     onValue(
                //         ref(this.db, `/devices/${taskId}/memoryUsage`)
                //     )
                // )

                return new Observable(obs => {
                    onValue(
                        ref(this.db, `/devices/${taskId}/memoryUsage`),
                        (snap) => {
                            obs.next(snap.val());
                        }
                    );
                });
            })
        );
        // onValue(
        //     ref(this.db, '/devices'),
        //     (data) => {
        //         console.log(data);
        //         console.log(data.val());
        //     }
        // );
    }
}
