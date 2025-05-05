import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

interface VirtualMachine {
  id: number;
  name: string;
  cores: number;
  ramGB: number;
  diskGB: number;
  operatingSystem: string;
  status: string;
  createdAt: string;
  lastModified: string;
  lastPaginationToken: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToastModule,
    ConfirmDialogModule,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  virtualMachines: VirtualMachine[] = [];
  selectedVM: VirtualMachine | null = null;
  vmDialog: boolean = false;
  isAdmin: boolean = false;
  loading: boolean = true;
  lastpagination: string = '{}';
  
  vm: VirtualMachine = {
    id: 0,
    name: '',
    cores: 0,
    ramGB: 0,
    diskGB: 0,
    operatingSystem: '',
    status: '',
    createdAt: '',
    lastModified: '',
    lastPaginationToken: ''
  };

  
  sistemasOperativos = [
    { label: 'Windows Server 2019', value: 'Windows Server 2019' },
    { label: 'Ubuntu Server 20.04', value: 'Ubuntu Server 20.04' },
    { label: 'CentOS 8', value: 'CentOS 8' },
    { label: 'Debian 11', value: 'Debian 11' }
  ];

  estados = [
    { label: 'Activo', value: 'Activo' },
    { label: 'Inactivo', value: 'Inactivo' },
    { label: 'Mantenimiento', value: 'Mantenimiento' }
  ];

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {    
    const role = localStorage.getItem('role');
    this.isAdmin = role === 'Admin';
    console.log(this.isAdmin);
    
  }

  ngOnInit() {
    this.loadVirtualMachines();
  }

  loadVirtualMachines() {
    this.loading = true;
    this.http.get<VirtualMachine[]>(`${environment.apiDashboard}/${environment.Queies.getall}${encodeURIComponent(this.lastpagination)}`)
      .subscribe({
        next: (data) => {
          console.log(data);
          
          this.virtualMachines = data;
          this.lastpagination = data[data.length - 1].lastPaginationToken;
          this.loading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar las máquinas virtuales'
          });
          this.loading = false;
        }
      });
  }

  openNew() {
    this.vm = {
      id: 0,
      name: '',
      cores: 0,
      ramGB: 0,
      diskGB: 0,
      operatingSystem: '',
      status: '',
      createdAt: '',
      lastModified: '',
      lastPaginationToken: ''
    };
    this.vmDialog = true;
  }

  editVM(vm: VirtualMachine) {
    this.vm = { ...vm };
    this.vmDialog = true;
  }

  deleteVM(vm: VirtualMachine) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar la máquina virtual ${vm.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete(`${environment.apiDashboard}/${environment.Queies.delete}${vm.id}`)
          .subscribe({
            next: () => {
              this.virtualMachines = this.virtualMachines.filter(val => val.id !== vm.id);
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Máquina virtual eliminada'
              });
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al eliminar la máquina virtual'
              });
            }
          });
      }
    });
  }

  saveVM() {
    if (this.vm.id) {
      // Update
      this.http.put(`${environment.apiDashboard}/${environment.Queies.update}${this.vm.id}`, this.vm)
        .subscribe({
          next: () => {
            const index = this.virtualMachines.findIndex(v => v.id === this.vm.id);
            this.virtualMachines[index] = { ...this.vm };
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Máquina virtual actualizada'
            });
            this.vmDialog = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar la máquina virtual'
            });
          }
        });
    } else {      
      this.http.post(`${environment.apiDashboard}/${environment.Queies.create}`, this.vm)
        .subscribe({
          next: (response: any) => {
            this.virtualMachines.push(response);
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Máquina virtual creada'
            });
            this.vmDialog = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al crear la máquina virtual'
            });
          }
        });
    }
  }

  hideDialog() {
    this.vmDialog = false;
  }

  logout() {
    this.confirmationService.confirm({
      message: '¿Estás seguro que deseas cerrar sesión?',
      header: 'Confirmar cierre de sesión',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Clear all stored data
        localStorage.clear();
        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'Sesión cerrada',
          detail: 'Has cerrado sesión exitosamente'
        });
        // Redirect to login page
        this.router.navigate(['/login']);
      }
    });
  }
} 