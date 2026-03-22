export abstract class BaseRepository<
  TEntity,
  TWhereUnique,
  TCreateInput,
  TUpdateInput
> {
  abstract findById(where: TWhereUnique): Promise<TEntity | null>;
  abstract findAll(): Promise<TEntity[]>;
  abstract create(data: TCreateInput): Promise<TEntity>;
  abstract update(where: TWhereUnique, data: TUpdateInput): Promise<TEntity>;
  abstract delete(where: TWhereUnique): Promise<TEntity>;
}
