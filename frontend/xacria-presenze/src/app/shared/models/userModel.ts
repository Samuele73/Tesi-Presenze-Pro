export interface userCredentials {
  name?: string,
  surname?: string,
  email: string,
  password: string
}


export interface UserProfile{
    email: string,
    name: string,
    surname: string,
    serialNum: number,
    duty: string,
    employmentType: string,
    hireDate: Date,
    iban: string,
    birthDate: Date,
    address: string,
    phone: string
}
