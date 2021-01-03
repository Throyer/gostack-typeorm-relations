import { DeepPartial, getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Product from '@modules/products/infra/typeorm/entities/Product';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    // const order = this.ormRepository.create({
    //   customer,
    //   order_products: products,
    // });

    const order = await this.ormRepository.save({
      customer,
      order_products: products.map(
        (product): DeepPartial<OrdersProducts> => ({
          ...product,
        }),
      ),
    });

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne({
      where: {
        id,
      },
      relations: ['order_products', 'customer'],
    });
    return order;
  }
}

export default OrdersRepository;
