import { BaseRepository } from './base.repository';

interface PrismaCrudDelegate<
  TRecord,
  TEntity,
  TWhereUnique,
  TCreateInput,
  TUpdateInput
> {
  findUnique(args: { where: TWhereUnique }): Promise<TRecord | null>;
  findMany(): Promise<TRecord[]>;
  create(args: { data: TCreateInput }): Promise<TRecord>;
  update(args: { where: TWhereUnique; data: TUpdateInput }): Promise<TRecord>;
  delete(args: { where: TWhereUnique }): Promise<TRecord>;
}

export abstract class BasePrismaRepository<
  TRecord,
  TEntity,
  TWhereUnique,
  TCreateInput,
  TUpdateInput
> extends BaseRepository<TEntity, TWhereUnique, TCreateInput, TUpdateInput> {
  protected constructor(
    protected readonly delegate: PrismaCrudDelegate<
      TRecord,
      TEntity,
      TWhereUnique,
      TCreateInput,
      TUpdateInput
    >,
    private readonly toEntity: (record: TRecord) => TEntity
  ) {
    super();
  }

  async findById(where: TWhereUnique): Promise<TEntity | null> {
    const record = await this.delegate.findUnique({ where });
    return record ? this.toEntity(record) : null;
  }

  async findAll(): Promise<TEntity[]> {
    const records = await this.delegate.findMany();
    return records.map((record) => this.toEntity(record));
  }

  async create(data: TCreateInput): Promise<TEntity> {
    const record = await this.delegate.create({ data });
    return this.toEntity(record);
  }

  async update(where: TWhereUnique, data: TUpdateInput): Promise<TEntity> {
    const record = await this.delegate.update({ where, data });
    return this.toEntity(record);
  }

  async delete(where: TWhereUnique): Promise<TEntity> {
    const record = await this.delegate.delete({ where });
    return this.toEntity(record);
  }
}
