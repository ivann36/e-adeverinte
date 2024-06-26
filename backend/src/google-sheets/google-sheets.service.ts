import { HttpException, HttpStatus, Injectable, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { VariableService } from 'src/variable/variable.service';
import { AttestationService } from 'src/attestation/attestation.service';
import { StudentService } from 'src/students/student.service';
import { AttestationDto } from 'src/attestation/attestation.dto';
import { GoogleAuthGuard } from 'src/google-auth/google-auth.guard';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

@Injectable()
@UseGuards(GoogleAuthGuard)
export class GoogleSheetsService {
  client: JWT;
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  isInitialized = false;
  
  constructor(
    private configService: ConfigService,
    private variableService: VariableService,
    private attestationService: AttestationService,
    private studentService: StudentService,
  ) {  
  }

  async init() {
    this.client = new google.auth.JWT({
      email: this.configService.get('CLIENT_EMAIL'),
      key: this.configService.get('PRIVATE_KEY').replace(/\\n/g, '\n'),
      keyFile: null,
      scopes: SCOPES,
    });
    this.client.authorize(async (error) => {
      if (!error) {
        console.log('Connected');
        this.sheets = google.sheets({
          version: 'v4',
          auth: this.client,
        });
      } else {
        console.error('Error connecting to google spreadsheet!');
        console.assert('Problem may be related to wrong local time!');
        console.log(error);
      }
    });
    this.spreadsheetId = this.configService.get('SPREADSHEET_ID');
    this.isInitialized = true;
  }

  async getNewEntries() {
    if (!this.isInitialized) {
      await this.init();
    }
    const lastEntryNumber = await this.variableService.getLastEntryNumber();
    const tableSizeResponse = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: 'Form Responses 1!F2',
    });
    console.log(`Table size response: ${tableSizeResponse.data.values}`);
    const tableSize = Number(tableSizeResponse.data.values[0][0]);
    if (lastEntryNumber == tableSize) {
      return [];
    }
    const entries = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `Form Responses 1!A${lastEntryNumber + 1}:C${tableSize}`,
    });
    const attestations: Array<AttestationDto> = [];

    console.log(lastEntryNumber, tableSize, entries.data.values);

    for (const attestation of entries.data.values) {
      const student = await this.studentService.getStudentByEmail(
        attestation[1],
      );
      if (student) {
        const newAttestation = new AttestationDto();
        newAttestation.purpose = attestation[2];
        newAttestation.soliciter = student.id
        newAttestation.date = new Date();
        newAttestation.status = 'unapproved';
        attestations.push(newAttestation);
      } else {
        throw new HttpException(
          'Student email not found!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    await this.attestationService.addNewEntries(attestations);
    await this.variableService.setLastEntryNumber(tableSize);
    return entries.data.values;
  }
}
