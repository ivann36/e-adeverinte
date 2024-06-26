import { Attestation } from '../attestation/attestation.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  fatherInitial: string;

  @Column()
  email: string;

  @Column()
  studyCycle: string;

  @Column()
  studyField: string;

  @Column()
  studyForm: string;

  @Column()
  studyYear: number;

  @Column()
  financiation: string;

  @Column({ type: 'character' })
  gender: string;

  @OneToMany(() => Attestation, (attestation) => attestation.soliciter)
  attestations: Attestation[];
}
