import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private StudentRepository: Repository<Student>,
  ) { }

  async getStudentById(id: number): Promise<Student | null> {
    return await this.StudentRepository.findOneBy({ id: id });
  }
  async getStudentByEmail(email: string): Promise<Student | null> {
    return await this.StudentRepository.findOneBy({ email: email });
  }

  async getAllStudents(limit: number, offset: number): Promise<{ students: Student[], totalPages: number }> {
    const [students, total] = await this.StudentRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    const totalPages = Math.ceil(total / limit);
    return { students, totalPages };
  }

  async createStudent(studentData: Partial<Student>): Promise<Student> {
    const newStudent = this.StudentRepository.create(studentData);
    return await this.StudentRepository.save(newStudent);
  }

  async updateStudent(
    id: number,
    studentData: Partial<Student>,
  ): Promise<Student> {
    await this.StudentRepository.update(id, studentData);
    return await this.StudentRepository.findOneBy({ id: id });
  }

  async deleteStudent(id: number): Promise<void> {
    await this.StudentRepository.delete(id);
  }
}
