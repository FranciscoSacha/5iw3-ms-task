//Francisco-Leblanc Sacha IW3 5ème année
import {
  ListTasksRequest,
  ListTasksResponse,
  GetTaskRequest,
  CreateTaskRequest,
  Task,
  UpdateTaskRequest,
  DeleteTaskRequest,
} from './../stubs/task/v1alpha/task';
import { Controller } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateTaskDto, toJs, toGrpc } from './dto/create-task.dto';
import { RpcException } from '@nestjs/microservices';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @GrpcMethod('TaskService')
  async CreateTask(request: CreateTaskRequest): Promise<Task> {
    try {
      const task = await this.tasksService.create(
        new CreateTaskDto(request.task),
      );
      return { ...task, dueDate: task.dueDate.toISOString() } as any;
    } catch (err) {
      if (err.code === 'P2009') {
        throw new RpcException({ message: 'Invalid Entry Data', code: 3 });
      }
      if (err.code === 'P2002') {
        throw new RpcException({ message: 'Task already exists', code: 6 });
      }
      throw new RpcException(err);
    }
  }

  @GrpcMethod('TaskService')
  async ListTasks(request: ListTasksRequest): Promise<ListTasksResponse> {
    try {
      const task = await this.tasksService.findAll();
      return ListTasksResponse.create({ task: task.map(toGrpc) });
    } catch (err) {
      throw new RpcException(err);
    }
  }

  @GrpcMethod('TaskService')
  async GetTask(request: GetTaskRequest): Promise<Task> {
    try {
      const task = await this.tasksService.findByName(request.name);
      if (!task) {
        throw new RpcException({ message: 'Task not found', code: 5 });
      }
      return { ...task } as any;
    } catch (err) {
      throw new RpcException(err);
    }
  }

  @GrpcMethod('TaskService')
  async UpdateTask(request: UpdateTaskRequest): Promise<Task> {
    try {
      const task = await this.tasksService.findOne(request.task.id);
      if (!task) {
        throw new RpcException({ message: 'Task not found', code: 5 });
      }
      const updatedTask = await this.tasksService.update(
        request.task.id,
        toJs(request.task),
      );
      return {
        ...updatedTask,
        dueDate: updatedTask.dueDate.toISOString(),
      } as any;
    } catch (err) {
      if (err.code === 'P2009') {
        throw new RpcException({ message: 'Invalid entry data', code: 3 });
      }
      throw new RpcException(err);
    }
  }

  @GrpcMethod('TaskService')
  async DeleteTask(request: DeleteTaskRequest): Promise<Task> {
    try {
      const task = await this.tasksService.findByName(request.name);
      if (!task) {
        throw new RpcException({ message: 'Task not found', code: 5 });
      }
      await this.tasksService.remove(task.id);
      return { ...task } as any;
    } catch (err) {
      throw new RpcException(err);
    }
  }
}
